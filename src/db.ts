export enum AccountType {
  Checking,
  CreditCard,
  Income,
  Budget,
}

export interface Account {
  name: string
  balance: number
  type: AccountType
  note?: string
}

export interface Transaction {
  id?: number
  date: string
  amount: number
  payee: string
  fromAccount: string
  toAccount: string
  note?: string
}
