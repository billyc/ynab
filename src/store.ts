import { State } from 'vue'
import { createStore } from 'vuex'

import { Account, AccountType, Transaction } from './db'

let stored = localStorage.getItem('everything') as any
// let stored = null

if (stored) {
  stored = JSON.parse(stored)
} else {
  stored = {
    id: 0,
    transactions: [],
    accounts: {
      Income: { name: 'Income', balance: 0, type: AccountType.Income },
      'To Be Budgeted': { name: 'To Be Budgeted', balance: 0, type: AccountType.Budget },
    },
  }
}

const saveEverything = (state: any) => {
  const everything = JSON.stringify(state, null, 2)
  console.log(everything)
  localStorage.setItem('everything', everything)
}

const store = createStore({
  state() {
    return {
      accounts: stored.accounts,
      transactions: stored.transactions,
      id: stored.id,
    }
  },
  mutations: {
    addAccount(state: State, account: Account) {
      state.accounts[account.name] = account
      saveEverything(state)
    },
    postTransaction(state: State, transaction: Transaction) {
      state.id += 1
      state.transactions.push({ ...transaction, id: state.id })

      // update account balances
      const fromAcct = state.accounts[transaction.fromAccount] as Account
      fromAcct.balance -= transaction.amount
      const toAcct = state.accounts[transaction.toAccount] as Account
      toAcct.balance += transaction.amount

      saveEverything(state)
      console.log(JSON.stringify(state, null, 2))
    },
  },
})

export default store
