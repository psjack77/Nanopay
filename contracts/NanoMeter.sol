// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title NanoMeter
/// @notice Permissionless, ownerless USDC credits for pay-per-call services.
/// @dev Amounts are USDC base units (6 decimals on Arc). Service kinds are presentation
/// hints only; payment does not invoke seller code. With standard, non-rebasing USDC,
/// the token balance backs the sum of all credits and earnings. Direct token donations
/// are surplus and cannot be rescued. No administrative or upgrade functions exist.
contract NanoMeter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Kind { Block, Entropy, Haiku }

    struct Service {
        address seller;
        Kind kind;
        bool active;
        uint96 price;
        string name;
    }

    IERC20 public immutable usdc;
    Service[] private _services;
    mapping(address => uint256) public credits;
    mapping(address => uint256) public earnings;
    uint256 public totalCalls;
    uint256 private _nonce;

    error ZeroAddress();
    error ZeroAmount();
    error ZeroPrice();
    error InvalidNameLength(uint256 length);
    error UnknownService(uint256 id);
    error NotSeller(uint256 id, address caller);
    error InactiveService(uint256 id);
    error PriceExceedsMaximum(uint96 price, uint96 maximum);
    error InsufficientCredits(uint256 available, uint256 required);
    error NoEarnings();

    event ServiceCreated(
        uint256 indexed id, address indexed seller, Kind kind, uint96 price, string name
    );
    event ServiceStatusChanged(uint256 indexed id, bool active);
    event Deposited(address indexed buyer, uint256 amount);
    event CreditsWithdrawn(address indexed buyer, uint256 amount);
    event EarningsWithdrawn(address indexed seller, uint256 amount);
    event Paid(
        uint256 indexed id,
        address indexed buyer,
        address indexed seller,
        uint96 price,
        bytes32 seed,
        uint256 blockNumber,
        uint256 timestamp
    );

    /// @notice Sets the USDC token permanently; there is no privileged account.
    /// @param usdc_ The nonzero address of the intended USDC ERC-20 contract.
    constructor(IERC20 usdc_) {
        if (address(usdc_) == address(0)) revert ZeroAddress();
        usdc = usdc_;
    }

    /// @notice Lists a service owned by the caller with an immutable price and name.
    /// @param kind Presentation hint for clients, not an onchain execution mode.
    /// @param price Price per call in USDC base units; must be positive.
    /// @param name Display name containing between 1 and 48 bytes inclusive.
    /// @return id The new service's zero-based identifier.
    function createService(Kind kind, uint96 price, string calldata name)
        external
        returns (uint256 id)
    {
        if (price == 0) revert ZeroPrice();
        uint256 length = bytes(name).length;
        if (length == 0 || length > 48) revert InvalidNameLength(length);

        id = _services.length;
        _services.push(Service({
            seller: msg.sender,
            kind: kind,
            active: true,
            price: price,
            name: name
        }));
        emit ServiceCreated(id, msg.sender, kind, price, name);
    }

    /// @notice Enables or disables an existing service; only its seller may call.
    /// @param id The service identifier.
    /// @param active The desired availability.
    function setServiceActive(uint256 id, bool active) external {
        Service storage service = _getService(id);
        if (service.seller != msg.sender) revert NotSeller(id, msg.sender);
        service.active = active;
        emit ServiceStatusChanged(id, active);
    }

    /// @notice Pulls approved USDC and credits only the actual amount received.
    /// @dev Receipt must be measured after the transfer, so crediting is performed
    /// after this interaction under the same reentrancy lock as both withdrawals.
    /// @param amount Positive amount to transfer in USDC base units.
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 balanceBefore = usdc.balanceOf(address(this));
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = usdc.balanceOf(address(this)) - balanceBefore;
        if (received == 0) revert ZeroAmount();
        credits[msg.sender] += received;
        emit Deposited(msg.sender, received);
    }

    /// @notice Withdraws the caller's unspent credits to their own address.
    /// @param amount Amount in USDC base units, no greater than the caller's credits.
    function withdrawCredits(uint256 amount) external nonReentrant {
        uint256 available = credits[msg.sender];
        if (available < amount) revert InsufficientCredits(available, amount);
        credits[msg.sender] = available - amount;
        usdc.safeTransfer(msg.sender, amount);
        emit CreditsWithdrawn(msg.sender, amount);
    }

    /// @notice Pays for one active service call using prepaid credits.
    /// @dev The seed is public, predictable and influenceable. It MUST NOT be used
    /// for secrets, secure randomness, lotteries, or any high-stakes purpose.
    /// No external service or seller callback is executed by this function.
    /// @param id The service identifier.
    /// @param maxPrice Maximum acceptable price in USDC base units.
    /// @return seed Public presentation seed interpreted by the frontend.
    function pay(uint256 id, uint96 maxPrice) external returns (bytes32 seed) {
        Service storage service = _getService(id);
        if (!service.active) revert InactiveService(id);
        uint96 price = service.price;
        if (price > maxPrice) revert PriceExceedsMaximum(price, maxPrice);
        uint256 available = credits[msg.sender];
        if (available < price) revert InsufficientCredits(available, price);

        address seller = service.seller;
        credits[msg.sender] = available - price;
        earnings[seller] += price;
        totalCalls++;
        seed = keccak256(abi.encode(
            block.prevrandao,
            blockhash(block.number - 1),
            msg.sender,
            id,
            _nonce++
        ));
        emit Paid(id, msg.sender, seller, price, seed, block.number, block.timestamp);
    }

    /// @notice Withdraws all of the caller's accrued seller earnings to themselves.
    /// @dev Reverts if nothing is owed; clears earnings before transferring USDC.
    function withdrawEarnings() external nonReentrant {
        uint256 amount = earnings[msg.sender];
        if (amount == 0) revert NoEarnings();
        earnings[msg.sender] = 0;
        usdc.safeTransfer(msg.sender, amount);
        emit EarningsWithdrawn(msg.sender, amount);
    }

    /// @notice Returns the total number of listed services, including inactive ones.
    /// @return count The number of services.
    function serviceCount() external view returns (uint256 count) {
        return _services.length;
    }

    /// @notice Returns a service's details, reverting with UnknownService if absent.
    /// @param id The service identifier.
    /// @return service The stored service details.
    function getService(uint256 id) external view returns (Service memory service) {
        return _getService(id);
    }

    function _getService(uint256 id) private view returns (Service storage service) {
        if (id >= _services.length) revert UnknownService(id);
        return _services[id];
    }
}
