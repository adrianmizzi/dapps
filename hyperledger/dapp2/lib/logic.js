'use strict';

/**
 * Create Election Transaction
 * @param {dapp2.CreateElection} tx
 * @transaction
 */
async function createElection(tx) {
  currentParticipant = getCurrentParticipant();

  const factory = getFactory();
  const namespace = 'dapp2';

  // get the asset registries
  const electionRegistry  = await getAssetRegistry(namespace + '.Election');
  const candidateRegistry = await getAssetRegistry(namespace + '.Candidate');
  const chairmanRegistry  = await getParticipantRegistry(namespace + '.Chairman');

  // add the chairman to the registry if does not exist
  const chairman = await chairmanRegistry.get(currentParticipant.getIdentifier());

  // chairman = factory.newResource(namespace, 'Chairman', c);
  // chairman.name = currentParticipant.getFullyQualifiedIdentifier();

  var candidates = [];

  // create the candidates
  for (let c of tx.candidateNames) {
    const candidate = factory.newResource(namespace, 'Candidate', c);
    await candidateRegistry.add(candidate);
    candidates.push(candidate);
  }

  // create the election
  const election = factory.newResource(namespace, 'Election', tx.electionId);
  election.chairman = chairman;
  election.status   = 'OPEN';
  election.candidates = candidates;

  // update the election in the asset registry
  await electionRegistry.add(election);
}

/**
 * Vote Transaction
 * @param {dapp2.Vote} tx
 * @transaction
 */
async function vote(tx) {
  currentParticipant = getCurrentParticipant();

  const factory = getFactory();
  const namespace = 'dapp2';

  const candidateRegistry =  await getAssetRegistry(namespace + '.Candidate');
  const candidate = await candidateRegistry.get(tx.candidate.name);
  if (candidate.voters === undefined) {
    candidate.voters = [];
  }

  candidate.voters.push(tx.voter);

  await candidateRegistry.update(candidate);
}

/**
 * Close Election Transaction
 * @param {dapp2.CloseElection} tx
 * @transaction
 */
async function closeElection(tx) {

}