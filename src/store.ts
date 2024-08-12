import { State } from 'vue'
import { createStore } from 'vuex'

import { Account, AccountType, Transaction } from './db'

let accounts = localStorage.getItem('accounts') || {
  Income: { name: 'Income', balance: 0, type: AccountType.Income },
  'To Be Budgeted': { name: 'To Be Budgeted', balance: 0, type: AccountType.Budget },
}

let transactions = localStorage.getItem('transactions') || []

const store = createStore({
  state() {
    return {
      accounts,
      transactions,
      id: 0,
    }
  },
  mutations: {
    addAccount(state: State, account: Account) {
      state.accounts[account.name] = account
    },
    postTransaction(state: State, transaction: Transaction) {
      state.id += 1
      state.transactions.push({ ...transaction, id: state.id })

      // update account balances
      const fromAcct = state.accounts[transaction.fromAccount] as Account
      fromAcct.balance -= transaction.amount
      const toAcct = state.accounts[transaction.toAccount] as Account
      toAcct.balance += transaction.amount

      console.log(JSON.stringify(state, null, 2))
    },
  },
})

export default store
