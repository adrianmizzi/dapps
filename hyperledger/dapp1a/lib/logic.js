/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Sample transaction
 * @param {dapp1a.PaymentTransaction} tx
 * @transaction
 */
async function paymentTransaction(tx) {
    // Save the old value of the asset.
    // const oldValue = tx.asset.value;

    if (tx.sender.getFullyQualifiedIdentifier() !== getCurrentParticipant().getFullyQualifiedIdentifier()) {
      throw new Error('Cannot invoke a payment from someone else\'s wallet:' + getCurrentParticipant().getFullyQualifiedIdentifier() + ' vs ' + tx.sender.getFullyQualifiedIdentifier());
    }
    // Update the asset with the new value.
    if (tx.sender.balance.amount < tx.value) {
      throw new Error('Not enough funds');
    }

    tx.sender.balance.amount -= tx.value;
    tx.recipient.balance.amount += tx.value;

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry('dapp1a.Balance');
    // Update the asset in the asset registry.
    await assetRegistry.update(tx.sender.balance);
    await assetRegistry.update(tx.recipient.balance);

    // Emit an event for the modified asset.
    // let event = getFactory().newEvent('dapp1a', 'SampleEvent');
    // event.asset = tx.asset;
    // event.oldValue = oldValue;
    // event.newValue = tx.newValue;
    // emit(event);
}
