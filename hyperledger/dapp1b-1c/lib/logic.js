'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Deposit Transaction
 * @param {dapp1b.DepositTransaction} tx
 * @transaction
 */
async function depositTransaction(tx) {
    currentParticipant = getCurrentParticipant();

    if (tx.sender.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier()) {
      throw new Error('Cannot invoke a deposit from someone else\'s wallet:' + getCurrentParticipant().getFullyQualifiedIdentifier() + ' vs ' + tx.sender.getFullyQualifiedIdentifier());
    }

    // Update the asset with the new value.
    if (tx.sender.wallet.balance < tx.value) {
      throw new Error('Not enough funds in wallet');
    }

    tx.sender.wallet.balance -= tx.value;

    const factory = getFactory();
    const namespace = 'dapp1b';

    // Create the escrow account
    const escrowAccount = factory.newResource(namespace, 'EscrowAccount', tx.depositId);
    escrowAccount.amount = tx.value;
    escrowAccount.sender = tx.sender;
    escrowAccount.recipient = tx.recipient;
    escrowAccount.waitUntil = tx.waitUntil;
    escrowAccount.expiry = tx.expiry;
    escrowAccount.status = 'OPEN';

    // Get the asset registry for the asset.
    const walletAssetRegistry = await getAssetRegistry('dapp1b.Wallet');

    // Update the sender's wallet in the asset registry.
    await walletAssetRegistry.update(tx.sender.wallet);

    // Get the escrow asset registry.
    const escrowAssetRegistry = await getAssetRegistry('dapp1b.EscrowAccount');

    // Update the escrow in the asset registry
    await escrowAssetRegistry.add(escrowAccount);

    // emit the event
    const depositEvent = factory.newEvent(namespace, 'DepositEvent');
    depositEvent.escrowAccountId = tx.depositId;
    depositEvent.value     = tx.value;
    depositEvent.sender    = tx.sender;
    depositEvent.recipient = tx.recipient;
    depositEvent.waitUntil = tx.waitUntil;
    depositEvent.expiry    = tx.expiry;
    emit(depositEvent);
}

/**
 * 
 * @param {dapp1b.WithdrawTransaction} tx 
 * @transaction
 */
async function withdrawTransaction(tx) {
  const factory = getFactory();
  const namespace = 'dapp1b';

  currentParticipant = getCurrentParticipant();

  if (tx.account.recipient.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier()) {
    throw new Error('Account cannot invoke Withdraw transaction');
  }

  if (tx.account.status !== 'OPEN') {
    throw new Error('Unable to withdraw from this account.  Status is ' + tx.account.status);
  }

  var now = new Date();
  
  if (tx.account.waitUntil > now) {
    throw new Error('Unable to withdraw deposit.  Wait until ' + tx.account.WaitUntil);
  }

  const amount = tx.account.amount;

  // add balance to recipient's wallet
  tx.account.recipient.wallet.balance += amount;

  // destroy the balance
  tx.account.amount = 0;
  tx.account.status = 'CLOSED_WITHDRAWN';
  tx.account.closedTime = now;

  // Get the asset registry for the asset.
  const walletAssetRegistry = await getAssetRegistry('dapp1b.Wallet');

  // Update the sender's wallet in the asset registry.
  await walletAssetRegistry.update(tx.account.recipient.wallet);

  // Get the escrow asset registry.
  const escrowAssetRegistry = await getAssetRegistry('dapp1b.EscrowAccount');

  // Update the escrow in the asset registry
  await escrowAssetRegistry.update(tx.account);
  
  const withdrawEvent = factory.newEvent(namespace, 'WithdrawalEvent');
  withdrawEvent.escrowAccountId = tx.account.accountId;
  withdrawEvent.value           = amount;
  withdrawEvent.recipient       = tx.account.recipient;
  emit(withdrawEvent);
}

/**
 * 
 * @param {dapp1b.RefundTransaction} tx 
 * @transaction
 */
async function refundTransaction(tx) {
  const factory = getFactory();
  const namespace = 'dapp1b';

  currentParticipant = getCurrentParticipant();

  if (tx.account.sender.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier()) {
    throw new Error('Account cannot invoke Refund transaction');
  }

  if (tx.account.status !== 'OPEN') {
    throw new Error('Unable to withdraw from this account.  Status is ' + tx.account.status);
  }

  var now = new Date();
  
  if (tx.account.expiry > now) {
    throw new Error('Unable to refund deposit.  Expiry ' + tx.account.expiry);
  }

  const amount = tx.account.amount;

  // add balance to recipient's wallet
  tx.account.sender.wallet.balance += amount;

  // destroy the balance
  tx.account.amount = 0;
  tx.account.status = 'CLOSED_REFUNDED';
  tx.account.closedTime = now;

  // Get the asset registry for the asset.
  const walletAssetRegistry = await getAssetRegistry('dapp1b.Wallet');

  // Update the sender's wallet in the asset registry.
  await walletAssetRegistry.update(tx.account.sender.wallet);

  // Get the escrow asset registry.
  const escrowAssetRegistry = await getAssetRegistry('dapp1b.EscrowAccount');

  // Update the escrow in the asset registry
  await escrowAssetRegistry.update(tx.account);
  
  const withdrawEvent = factory.newEvent(namespace, 'WithdrawalEvent');
  withdrawEvent.escrowAccountId = tx.account.accountId;
  withdrawEvent.value           = amount;
  withdrawEvent.recipient       = tx.account.sender;
  emit(withdrawEvent);
}

/**
 * @param {dapp1b.SetupDemo} tx
 * @transaction
 */
async function populate() {
  console.log('Populate Demo Assets and Participants');

  const factory = getFactory();
  const namespace = 'dapp1b';

  // clean up wallet and user registry
  walletRegistry = await getAssetRegistry('dapp1b.Wallet');
  const wallets = await walletRegistry.getAll();
  await walletRegistry.removeAll(wallets);

  userRegistry = await getParticipantRegistry('dapp1b.User');
  const users = await userRegistry.getAll();
  await userRegistry.removeAll(users);

  // create the wallets
  const wallet1 = factory.newResource(namespace, 'Wallet', '1');
  wallet1.balance = 100;
  const wallet2 = factory.newResource(namespace, 'Wallet', '2');
  wallet2.balance = 100;

  // const walletRegistry = await getAssetRegistry(namespace + '.Wallet');
  await walletRegistry.add(wallet1);
  await walletRegistry.add(wallet2);

  // create and add the persons
  const alice = factory.newResource(namespace, 'User', '1');
  alice.wallet = wallet1;
  const bob   = factory.newResource(namespace, 'User', '2');
  bob.wallet = wallet2;

  // const userRegistry = await getParticipantRegistry(namespace + '.User');
  await userRegistry.add(alice);
  await userRegistry.add(bob);
}

/**
 * Deposit With Lock Transaction
 * @param {dapp1b.DepositWithLockTransaction} tx
 * @transaction
 */
async function depositWithLockTransaction(tx) {
  currentParticipant = getCurrentParticipant();

  if (tx.sender.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier()) {
    throw new Error('Cannot invoke a deposit from someone else\'s wallet:' + getCurrentParticipant().getFullyQualifiedIdentifier() + ' vs ' + tx.sender.getFullyQualifiedIdentifier());
  }

  // Check if there is enough balance
  if (tx.sender.wallet.balance < tx.value) {
    throw new Error('Not enough funds in wallet');
  }

  tx.sender.wallet.balance -= tx.value;

  const factory = getFactory();
  const namespace = 'dapp1b';

  // Create the escrow account
  const escrowAccount = factory.newResource(namespace, 'EscrowAccountWithLock', tx.depositId);
  escrowAccount.amount = tx.value;
  escrowAccount.sender = tx.sender;
  escrowAccount.recipient = tx.recipient;
  escrowAccount.waitUntil = tx.waitUntil;
  escrowAccount.expiry = tx.expiry;
  escrowAccount.status = 'OPEN';
  escrowAccount.hash   = tx.hash

  // Get the asset registry for the asset.
  const walletAssetRegistry = await getAssetRegistry('dapp1b.Wallet');

  // Update the sender's wallet in the asset registry.
  await walletAssetRegistry.update(tx.sender.wallet);

  // Get the escrow asset registry.
  const escrowAssetRegistry = await getAssetRegistry('dapp1b.EscrowAccountWithLock');

  // Update the escrow in the asset registry
  await escrowAssetRegistry.add(escrowAccount);

  // emit the event
  const depositEvent = factory.newEvent(namespace, 'DepositEvent');
  depositEvent.escrowAccountId = tx.depositId;
  depositEvent.value     = tx.value;
  depositEvent.sender    = tx.sender;
  depositEvent.recipient = tx.recipient;
  depositEvent.waitUntil = tx.waitUntil;
  depositEvent.expiry    = tx.expiry;
  emit(depositEvent);
}

/**
 * 
 * @param {dapp1b.WithdrawWithLockTransaction} tx 
 * @transaction
 */
async function withdrawWithLockTransaction(tx) {
  const factory = getFactory();
  const namespace = 'dapp1b';

  currentParticipant = getCurrentParticipant();

  if (tx.account.recipient.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier()) {
    throw new Error('Account cannot invoke Withdraw transaction');
  }

  if (tx.account.status !== 'OPEN') {
    throw new Error('Unable to withdraw from this account.  Status is ' + tx.account.status);
  }

  var hash = require('fabric-client/lib/hash.js');
  h = hash.sha2_256(tx.preimage);
  if (h !== tx.account.hash) {
    throw new Error('Supplied preimage does not match hash ' + h + ' (hash is ' + tx.account.hash + ')');
  }

  var now = new Date();
  
  if (tx.account.waitUntil > now) {
    throw new Error('Unable to withdraw deposit.  Wait until ' + tx.account.WaitUntil);
  }

  const amount = tx.account.amount;

  // add balance to recipient's wallet
  tx.account.recipient.wallet.balance += amount;

  // destroy the balance
  tx.account.amount = 0;
  tx.account.status = 'CLOSED_WITHDRAWN';
  tx.account.closedTime = now;

  // Get the asset registry for the asset.
  const walletAssetRegistry = await getAssetRegistry('dapp1b.Wallet');

  // Update the sender's wallet in the asset registry.
  await walletAssetRegistry.update(tx.account.recipient.wallet);

  // Get the escrow asset registry.
  const escrowAssetRegistry = await getAssetRegistry('dapp1b.EscrowAccountWithLock');

  // Update the escrow in the asset registry
  await escrowAssetRegistry.update(tx.account);
  
  const withdrawEvent = factory.newEvent(namespace, 'WithdrawalEvent');
  withdrawEvent.escrowAccountId = tx.account.accountId;
  withdrawEvent.value           = amount;
  withdrawEvent.recipient       = tx.account.recipient;
  emit(withdrawEvent);
}