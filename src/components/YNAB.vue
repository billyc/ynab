<template lang="pug">
.ynab
    //- h1 YNAB

    h3.caps + Transaction
    .add-account.box-thing.flex-col.gap25
      b Amount
      n-input(v-model:value="payAmount" size="small" round placeholder="0")
      b Payee
      n-input(v-model:value="payee" size="small" round placeholder="Payee")
      b Category
      .acct-buttons
        .category-button(v-for="acct in allBudgets.filter(a => a.name !='@Available')")
          n-button(size="tiny" type="info" round :ghost="category!==acct.name" @click="category=acct.name") {{ acct.name }}
      b Account
      .acct-buttons(v-for="acct in allAccounts")
        n-button(size="tiny" type="error" round :ghost="whichAccount!==acct.name" @click="whichAccount=acct.name") {{ acct.name }}
      n-button(size="small" type="success" round block
        @click="addTransaction"
      ) Post

    h3.caps Budgets
    .accounts.clickable(v-for="account in allBudgets")
      .flex-row(@click="addMoney=account.name")
        .value-column {{ -1 * account.balance }}
        b &nbsp;{{ account.name }}
      .adder.flex-row.gap25(v-if="account.name == addMoney")
        n-input(v-model:value="xferAmount" size="small" placeholder="Add Money")
        n-button(size="small" type="info" round
          @click="addMoneyToBudget"
        ) Assign

    h3.caps Accounts
    .accounts(v-for="account in allAccounts")
      .flex-row
        .value-column {{ account.balance }}
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

</template>

<script lang="ts">
import { defineComponent } from 'vue'
// import type { PropType } from 'vue'
import { NSpace, NInput, NButton } from 'naive-ui'
import { Temporal } from '@js-temporal/polyfill'

import { Account, AccountType, Transaction } from '../db'

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
      whichAccount: '',
      xferAmount: '',
      payAmount: '',
      payee: '',
    }
  },
  computed: {
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

    clearAllData() {
      this.$store.commit('clearAllData')
    },
  },

  mounted() {
    this.whichAccount = localStorage.getItem('whichAccount') || ''
  },

  methods: {
    addTransaction() {
      const amount = parseFloat(this.payAmount || '0')
      if (!amount) return
      if (!this.whichAccount) return

      let transaction: Transaction = {
        date: Temporal.Now.plainDateISO().toString(),
        amount,
        payee: this.payee,
        fromAccount: this.whichAccount,
        toAccount: this.category,
      }

      this.$store.commit('postTransaction', transaction)
      this.payee = ''
      this.payAmount = ''
      this.category = ''

      localStorage.setItem('whichAccount', this.whichAccount)
    },

    addMoneyToBudget() {
      const amount = parseFloat(this.xferAmount || '0')
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
        toAccount: '@Available',
      }
      this.$store.commit('postTransaction', transaction)
      this.addMoney = ''
      this.xferAmount = ''
    },

    createAccount() {
      const balance = parseFloat(this.addOpeningBalance || '0')
      const account: Account = {
        name: this.addAccount,
        type: this.addType == 'checking' ? AccountType.Checking : AccountType.CreditCard,
        balance,
      }
      this.$store.commit('addAccount', account)

      // Special handling of accounts with an opening balance
      if (balance > 0 && account.type == AccountType.Checking) {
        let transaction: Transaction = {
          date: Temporal.Now.plainDateISO().toString(),
          amount: balance,
          payee: 'Opening Balance',
          fromAccount: '@Available',
          toAccount: 'Income',
        }
        this.$store.commit('postTransaction', transaction)
      }
    },

    createBudget() {
      const account: Account = {
        name: this.addBudget,
        type: AccountType.Budget,
        balance: 0,
      }
      this.$store.commit('addAccount', account)
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
}

.box-thing {
  margin-top: 1rem;
  background-color: #f1feeb;
  padding: 0.25rem 0.25rem;
  border-radius: 16px;
  border: 1px solid #ccc;
}

.value-column {
  min-width: 3.5rem;
  text-align: right;
  margin-right: 0.25rem;
}
</style>
