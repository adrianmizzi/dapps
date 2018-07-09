pragma solidity ^0.4.23;

// This contract is a decentralised auction system
// Anyone can list a new item with an expiry
// Anyone can bid for items
// When auction expires, the highest bidder wins the item
contract DApp3 {
    enum Status {OPEN, CLOSED}

    struct Item {
        bytes32 shortName;
        address seller;
        address highestBidder;
        uint    highestBid;
        uint    expiry;
        Status  status;
    }

    Item[] public items;

    function sellItem(bytes32 _shortName, uint _expiry) public returns (uint) {
        items.push(Item({shortName:_shortName, 
            seller:msg.sender, 
            highestBidder:msg.sender, 
            highestBid:0, 
            expiry:now + _expiry, 
            status:Status.OPEN}));
        return items.length;
    }

    function bid(uint idx, uint bidPrice) public returns (bool) {
        if (idx >= items.length 
            || items[idx].highestBidder == msg.sender
            || items[idx].highestBid >= bidPrice
            || items[idx].expiry < now
            || items[idx].status == Status.CLOSED) 
        return false;

        items[idx].highestBidder = msg.sender;
        items[idx].highestBid = bidPrice;

        return true;
    }

    function closeAuction(uint idx) public returns (bool){
        if (idx >= items.length
            || items[idx].status == Status.CLOSED
            || items[idx].expiry > now
            || items[idx].seller != msg.sender)
        return;

        items[idx].status = Status.CLOSED;
    }

    function getItem(uint idx) public view returns (bytes32, address, uint, Status) {
        return (items[idx].shortName, items[idx].highestBidder, items[idx].highestBid, items[idx].status);
    }
}