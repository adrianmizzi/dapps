pragma solidity ^0.4.23;

contract DApp1b {
    uint public value;
    uint public lockedUntil;
    uint public expiry;
    address public receiver;
    address public owner;
    bool public locked;
    
    function deposit(address _receiver, uint _lockTime, uint _expiry) public payable {
        if (locked) msg.sender.transfer(msg.value);

        value = msg.value;
        owner = msg.sender;
        lockedUntil = now + _lockTime;
        expiry = now + _expiry;
        receiver = _receiver;
        locked = true;
    }
    
    function withdraw() public {
        if (msg.sender != receiver) return;
        if (now < lockedUntil) return;
        
        selfdestruct(receiver);
    }
    
    function refund() public {
        if (msg.sender != owner) return;
        if (now < expiry) return;
        
        selfdestruct(owner);
    }
}
