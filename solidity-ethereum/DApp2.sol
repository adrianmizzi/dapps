pragma solidity ^0.4.23;

contract DApp2 {
    address public owner;

    struct Candidate {
        bytes32 name; 
        uint voteCount;
    }

    struct Voter {
        bool voted;
        uint vote;
    }

    Candidate[] public candidates;
    mapping (address => Voter) voters;

    constructor (bytes32[] candidateNames) public {
        owner = msg.sender;

        for (uint i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate({name: candidateNames[i], voteCount: 0}));
        }
    }

    function getNumCandidates() public view returns (uint) {
        return candidates.length;
    }

    function vote(uint candidate) public returns (bool votingResult) {
        address voter = msg.sender;

        if(voters[voter].voted) return false;

        voters[voter] = Voter({voted:true, vote: candidate});
        candidates[candidate].voteCount++; 

        return true;
    }

    function getWinner() public view returns (bytes32 name) {
        if (candidates.length == 0) return "No Candidates!";

        Candidate memory winner = candidates[0];

        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winner.voteCount) {
                winner = candidates[i];
            }
        }

        return winner.name;
    }

}