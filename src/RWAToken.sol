// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title RWAToken — ERC-721 representing tokenized real-world assets
/// @notice Each token holds on-chain metadata describing the underlying asset
contract RWAToken is ERC721, Ownable {
    enum AssetType {
        INVOICE,
        TREASURY_BILL,
        REAL_ESTATE
    }

    struct RWAMetadata {
        AssetType assetType;
        uint256 faceValue; // USD value in 18 decimals
        uint256 maturityDate; // unix timestamp
        string issuerName;
        bytes32 documentHash; // IPFS CID hash
        bool verified;
        bool active; // false once expired/burned
    }

    uint256 private _nextTokenId;
    mapping(uint256 => RWAMetadata) private _metadata;

    event RWAMinted(uint256 indexed tokenId, address indexed to, AssetType assetType, uint256 faceValue);
    event RWAVerified(uint256 indexed tokenId);
    event RWABurned(uint256 indexed tokenId);

    constructor(
        string memory name_,
        string memory symbol_,
        address owner_
    ) ERC721(name_, symbol_) Ownable(owner_) {
        _nextTokenId = 1;
    }

    /// @notice Mint a new RWA token with metadata
    function mint(
        address to,
        AssetType assetType,
        uint256 faceValue,
        uint256 maturityDate,
        string calldata issuerName,
        bytes32 documentHash
    ) external returns (uint256 tokenId) {
        require(faceValue > 0, "Face value must be > 0");
        require(maturityDate > block.timestamp, "Maturity must be in the future");

        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        _metadata[tokenId] = RWAMetadata({
            assetType: assetType,
            faceValue: faceValue,
            maturityDate: maturityDate,
            issuerName: issuerName,
            documentHash: documentHash,
            verified: false,
            active: true
        });

        emit RWAMinted(tokenId, to, assetType, faceValue);
    }

    /// @notice Admin verifies the RWA token after off-chain due diligence
    function verify(uint256 tokenId) external onlyOwner {
        require(_metadata[tokenId].active, "Token not active");
        require(!_metadata[tokenId].verified, "Already verified");
        _metadata[tokenId].verified = true;
        emit RWAVerified(tokenId);
    }

    /// @notice Burn an RWA token (expired or repaid asset)
    function burn(uint256 tokenId) external {
        require(
            ownerOf(tokenId) == msg.sender || msg.sender == owner(),
            "Not token owner or admin"
        );
        _metadata[tokenId].active = false;
        _burn(tokenId);
        emit RWABurned(tokenId);
    }

    /// @notice Get metadata for a token
    function getMetadata(uint256 tokenId) external view returns (RWAMetadata memory) {
        require(_metadata[tokenId].faceValue > 0, "Token does not exist");
        return _metadata[tokenId];
    }

    /// @notice Get the face value in USD (18 decimals)
    function getFaceValue(uint256 tokenId) external view returns (uint256) {
        return _metadata[tokenId].faceValue;
    }

    /// @notice Check if a token is verified
    function isVerified(uint256 tokenId) external view returns (bool) {
        return _metadata[tokenId].verified;
    }

    /// @notice Check if a token is active
    function isActive(uint256 tokenId) external view returns (bool) {
        return _metadata[tokenId].active;
    }

    /// @notice Total tokens minted (including burned)
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
