<template lang="pug">
.ynab
    //- h1 YNAB

    .add-account.box-thing.flex-col
      .center: b.caps(style="color: blue") Transaction+
      .grid(style="grid-auto-columns: auto 1fr; gap: 0 0.5rem;")
        b(style="grid-row: 1/2") Amount
        n-input(style="grid-row: 1/2" v-model:value="payAmount" size="small" round placeholder="0")
        b(style="grid-row: 2/3") Payee
        n-input(style="grid-row: 2/3" v-model:value="payee" size="small" round placeholder="Payee")

      p: b Category
      .acct-buttons
        .category-button(v-for="acct in allCategories")
          n-button(size="tiny" :type="acct.color || 'info'" round :ghost="category!==acct.name"
            @click="category=acct.name"
          ) {{ acct.name }}

      p: b Account
      .acct-buttons
        .category-button(v-for="acct in allAccounts")
          n-button(size="tiny" type="error" round :ghost="whichAccount!==acct.name"
            @click="whichAccount=acct.name"
          ) {{ acct.name }}

      .transfer(v-if="category=='CC Payment'")
        p: b Transfer Destination
        .acct-buttons
          .category-button(v-for="acct in allAccounts.filter(a => a.type == 1)")
            n-button(size="tiny" type="info" round :ghost="xferDest!==acct.name"
              @click="xferDest=acct.name"
            ) {{ acct.name }}

      p.post
        n-button(size="small" type="success" round block :disabled="!isPostEnabled"
          @click="addTransaction"
        ) Post

    .box-thing(style="background-color: #6fb;")
      .center: b.caps Budgets
      .accounts.clickable(v-for="account in allBudgets")
        .flex-row(@click="addMoney=account.name")
          .value-column {{ -1 * account.balance / 100.0 }}
          b &nbsp;{{ account.name }}
        .adder.flex-row.gap25(v-if="account.name == addMoney")
          n-input(v-model:value="xferAmount" size="small" placeholder="Add Money")
          n-button(size="small" type="info" round
            @click="addMoneyToBudget"
          ) Assign
          n-button(size="small" type="success" round
            @click="viewTransactions(account.name)"
          ) View All

    .box-thing(v-if="filteredAccount")
      .center: b.caps Details: {{  filteredAccount }}
      .flex-col
        .detail-row.flex-row(v-for="row,i in filteredTransactions" style="gap: 0.5rem")
          .xitem(style="color: blue") {{ row.date }}
          b.xitem {{ (parseInt(row.amount)/100).toFixed(2) }}
          .xitem.flex1 {{ row.payee }}
          .xitem {{ row.fromAccount }}
          .xitem -> {{ row.toAccount }}

    .box-thing(style="background-color: #fb4;")
      .center: b.caps Accounts
      .accounts(v-for="account in allAccounts")
        .flex-row
          .value-column {{ account.balance / 100.0 }}
          b &nbsp;{{ account.name }}

    h3.caps Admin

    .add-account.box-thing(style="background-color: #ffc")
      b: i Add Budget Category
      n-space(vertical)
        n-input(v-model:value="addBudget" size="small" round placeholder="Name")
        n-button(size="small" type="success" round block
          @click="createBudget"
        ) Create

    .add-account.box-thing
      b: i Add Account
      n-space(vertical)
        n-input(v-model:value="addAccount" size="small" round placeholder="Name")
        n-input(v-model:value="addOpeningBalance" size="small" round placeholder="Opening Balance")
        .flex-row(style="gap: 0.25rem")
          n-button(size="tiny" type="info" round :ghost="addType!=='checking'"
            @click="addType='checking'"
          ) Checking
          n-button(size="tiny" type="warning" round :ghost="addType!=='credit'"
            @click="addType='credit'"
          ) Credit Card
        n-button(size="small" type="success" round block
          @click="createAccount"
        ) Create

    br
    br
    n-button(type="error" @click="clearAllData") Clear ALL data!
    br

</template>

<script lang="ts">
import { defineComponent } from 'vue'
// import type { PropType } from 'vue'
import { NSpace, NInput, NButton } from 'naive-ui'
import { Temporal } from '@js-temporal/polyfill'

import { Account, AccountType, Transaction } from '../db'

export enum Special {
  Available = '@Available',
  CreditCardPayment = 'CC Payment',
  Debt = 'Debt',
}

const MyComponent = defineComponent({
  name: 'MyComponent',
  components: { NSpace, NInput, NButton },
  props: {
    // root: { type: String, required: true },
  },
  data() {
    return {
      addType: 'checking',
      addAccount: '',
      addBudget: '',
      addMoney: '',
      addOpeningBalance: '',
      category: '',
      filteredAccount: '',
      filteredTransactions: [] as Transaction[],
      whichAccount: '',
      xferAmount: '',
      xferDest: '',
      payAmount: '',
      payee: '',
    }
  },
  computed: {
    state() {
      return this.$store.state
    },

    isPostEnabled() {
      return this.payAmount && this.payee && this.category && this.whichAccount
    },

    allAccounts() {
      const all = Object.values(this.$store.state.accounts) as Account[]
      return all.filter(acct => acct.type <= AccountType.CreditCard)
    },

    allBudgets() {
      const all = Object.values(this.$store.state.accounts) as Account[]
      return all
        .filter(acct => acct.type == AccountType.Budget)
        .sort((a, b) => (a.name < b.name ? -1 : 1))
    },

    allCategories() {
      const categories = this.allBudgets
        .filter(acct => acct.type == AccountType.Budget)
        .filter(acct => acct.name !== Special.Available)
        .filter(acct => acct.name !== Special.CreditCardPayment)

      if (this.allAccounts.filter(a => a.type == AccountType.CreditCard).length) {
        categories.push({
          name: Special.CreditCardPayment,
          type: AccountType.Budget,
          balance: 0,
          color: 'warning',
        })
      }

      categories.push({
        name: '@Deposit',
        type: AccountType.Budget,
        balance: 0,
        color: 'success',
      })

      return categories
    },
  },

  mounted() {
    this.whichAccount = localStorage.getItem('whichAccount') || ''
  },

  methods: {
    addTransaction() {
      const amount = Math.round(100.0 * parseFloat(this.payAmount || '0'))
      if (!amount) return
      if (!this.whichAccount) return

      let transaction: Transaction = {
        date: Temporal.Now.plainDateISO().toString(),
        amount,
        payee: this.payee.trim(),
        fromAccount: this.whichAccount.trim(),
        toAccount: this.category.trim(),
      }

      // Credit card charges are special
      if (this.state.accounts[this.whichAccount].type == AccountType.CreditCard) {
        this.$store.commit('postTransaction', {
          date: Temporal.Now.plainDateISO().toString(),
          amount,
          payee: this.payee.trim(),
          fromAccount: Special.CreditCardPayment,
          toAccount: Special.Debt,
        })
      }

      // Deposits are special
      if (this.category == '@Deposit') {
        transaction.fromAccount = Special.Available
        transaction.toAccount = this.whichAccount.trim()
      }

      // Transfers are special
      if (this.category == Special.CreditCardPayment) {
        transaction.fromAccount = this.whichAccount.trim()
        transaction.toAccount = Special.CreditCardPayment

        // update Debt account
        this.$store.commit('postTransaction', {
          date: Temporal.Now.plainDateISO().toString(),
          amount,
          payee: this.payee.trim(),
          fromAccount: Special.Debt,
          toAccount: this.xferDest.trim(),
        })
      }

      this.$store.commit('postTransaction', transaction)
      this.payee = ''
      this.payAmount = ''
      this.category = ''

      localStorage.setItem('whichAccount', this.whichAccount)
    },

    addMoneyToBudget() {
      const amount = Math.round(100 * parseFloat(this.xferAmount || '0'))
      if (!amount) {
        this.addMoney = ''
        return
      }

      const destinationAccount = this.$store.state.accounts[this.addMoney]
      let transaction: Transaction = {
        date: Temporal.Now.plainDateISO().toString(),
        amount,
        payee: '',
        fromAccount: destinationAccount.name,
        toAccount: Special.Available,
      }
      this.$store.commit('postTransaction', transaction)
      this.addMoney = ''
      this.xferAmount = ''
    },

    createAccount() {
      // create account itself
      const account: Account = {
        name: this.addAccount.trim(),
        type: this.addType == 'checking' ? AccountType.Checking : AccountType.CreditCard,
        balance: 0,
      }
      this.$store.commit('addAccount', account)

      // add credit-card-payment categories if we added a credit card
      if (
        account.type == AccountType.CreditCard &&
        !(Special.CreditCardPayment in this.state.accounts)
      ) {
        this.$store.commit('addAccount', {
          name: Special.CreditCardPayment,
          type: AccountType.Budget,
          balance: 0,
        })
        this.$store.commit('addAccount', {
          name: Special.Debt,
          type: AccountType.Debt,
          balance: 0,
        })
      }

      // opening balance transactions
      const balance = Math.round(100 * parseFloat(this.addOpeningBalance || '0'))
      if (balance) {
      }

      // Special handling of accounts with an opening balance
      if (account.type == AccountType.Checking) {
        this.$store.commit('postTransaction', {
          date: Temporal.Now.plainDateISO().toString(),
          amount: balance,
          payee: 'Opening Balance',
          fromAccount: Special.Available,
          toAccount: this.addAccount.trim(),
        })
      }

      if (account.type == AccountType.CreditCard) {
        this.$store.commit('postTransaction', {
          date: Temporal.Now.plainDateISO().toString(),
          amount: balance,
          payee: 'Opening Balance',
          fromAccount: this.addAccount.trim(),
          toAccount: Special.Debt,
        })
      }

      // clean up
      this.addAccount = ''
      this.addOpeningBalance = ''
    },

    createBudget() {
      const account: Account = {
        name: this.addBudget.trim(),
        type: AccountType.Budget,
        balance: 0,
      }
      this.$store.commit('addAccount', account)
      this.addBudget = ''
    },

    viewTransactions(accountName: string) {
      const transactions = this.state.transactions
        .filter((row: Transaction) => {
          return row.fromAccount == accountName || row.toAccount == accountName
        })
        .filter((row: Transaction) => !!row.payee)
        .sort((a: Transaction, b: Transaction) => (a.date < b.date ? 1 : -1))

      console.log(JSON.stringify(transactions, null, 2))
      if (transactions.length) {
        this.filteredAccount = accountName
        this.filteredTransactions = transactions
      } else {
        this.filteredAccount = ''
        this.filteredTransactions = []
      }
    },

    clearAllData() {
      console.log('CLEARING ALL DATA')
      this.$store.commit('clearAllData')
    },
  },
})

export default MyComponent
</script>

<style scoped>
.ynab {
  width: 100%;
}

h3 {
  padding: 0 0.25rem;
  background-color: #fea5ba;
}

p {
  margin: 0.5rem 0 0 0;
}

.read-the-docs {
  color: #888;
}

.acct-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: -0.25rem;
}

.box-thing {
  margin-top: 1rem;
  background-color: #f0f0f0;
  padding: 0.25rem 0.25rem;
  border-radius: 16px;
  border: 1px solid #ccc;
}

.value-column {
  min-width: 4.5rem;
  text-align: right;
  margin-right: 0.25rem;
}

.center {
  text-align: center;
}
</style>
