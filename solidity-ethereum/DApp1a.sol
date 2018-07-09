pragma solidity ^0.4.23;

contract DApp1a {

    /* Anyone can send to anyone */
    function sendAmount(address _receiver) public payable {
        _receiver.transfer(msg.value);
    }
}
