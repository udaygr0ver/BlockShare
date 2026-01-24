// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FileStorage {

    struct File {
        string ipfsHash;
        string fileName;
        address owner;
        bool exists;
    }

    File[] public files;
    mapping(uint => mapping(address => bool)) public accessList;
    
    event FileAccessed(uint indexed fileIndex, address indexed user);
    event FileDeleted(uint indexed fileIndex, address indexed owner);

    function uploadFile(string memory _hash, string memory _name) public {
        files.push(File({
            ipfsHash: _hash,
            fileName: _name,
            owner: msg.sender,
            exists: true
        }));
        accessList[files.length - 1][msg.sender] = true;
    }

    function deleteFile(uint _fileIndex) public {
        require(_fileIndex < files.length, "Invalid index");
        require(files[_fileIndex].owner == msg.sender, "Only owner can delete");
        require(files[_fileIndex].exists, "File already deleted");

        files[_fileIndex].exists = false;
        // Optionally clear data to save gas / remove info
        files[_fileIndex].ipfsHash = "";
        files[_fileIndex].fileName = "";
        
        emit FileDeleted(_fileIndex, msg.sender);
    }

    function grantAccess(uint _fileIndex, address _user) public {
        require(files[_fileIndex].exists, "File does not exist");
        require(files[_fileIndex].owner == msg.sender, "Only owner can grant access");
        accessList[_fileIndex][_user] = true;
    }

    function hasAccess(uint _fileIndex, address _user) public view returns (bool) {
        if (_fileIndex >= files.length) return false;
        if (!files[_fileIndex].exists) return false;
        return accessList[_fileIndex][_user];
    }

    function getFile(uint index) public view returns(string memory hash, string memory name) {
        require(index < files.length, "Invalid index");
        require(files[index].exists, "File does not exist");
        return (files[index].ipfsHash, files[index].fileName);
    }
    
    function getFileCount() public view returns (uint) {
        return files.length;
    }
}
