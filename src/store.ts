import { State } from 'vue'
import { createStore } from 'vuex'

import { Account, AccountType, Transaction } from './db'

// let stored = null
let stored = localStorage.getItem('everything') as any

if (stored) {
  stored = JSON.parse(stored)
} else {
  stored = {
    id: 0,
    transactions: [],
    accounts: {
      'Opening Balance': { name: 'Income', balance: 0, type: AccountType.Income },
      '@Available': { name: '@Available', balance: 0, type: AccountType.Budget },
    },
  }
}

const saveEverything = (state: any) => {
  const everything = JSON.stringify(state, null, 2)
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
    clearAllData() {
      localStorage.clear()
    },

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
