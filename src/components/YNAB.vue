<template lang="pug">
.ynab
    h1 YNAB

    h3 Accounts
    .accounts(v-for="account in allAccounts")
      p
        b {{ account.name }}
        span &nbsp;{{ account.balance }}

    h3 Budgets
    .accounts(v-for="account in allBudgets")
      p
        b {{ account.name }}
        span &nbsp;{{ account.balance }}

    hr

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
      addOpeningBalance: '',
    }
  },
  computed: {
    allAccounts() {
      const all = Object.values(this.$store.state.accounts) as Account[]
      return all.filter(acct => acct.type <= AccountType.CreditCard)
    },

    allBudgets() {
      const all = Object.values(this.$store.state.accounts) as Account[]
      return all.filter(acct => acct.type == AccountType.Budget)
    },
  },

  mounted() {
    console.log('state', this.$store.state)
  },

  methods: {
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
          fromAccount: 'Income',
          toAccount: 'To Be Budgeted',
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
p {
  margin: 0.5rem 0 0 0;
}

.read-the-docs {
  color: #888;
}

.box-thing {
  margin-top: 1rem;
  background-color: #f1feeb;
  padding: 0.25rem 0.25rem;
  border-radius: 16px;
  border: 1px solid #ccc;
}
</style>
