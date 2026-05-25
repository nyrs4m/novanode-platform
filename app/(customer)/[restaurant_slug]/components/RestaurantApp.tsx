'use client'

import { useState } from 'react'
import { Tables } from '@/types/database.types'
import SessionScreen from '../session'
import MenuClient from './MenuClient'

type Restaurant = Tables<'restaurants'>
type Category = Tables<'categories'>
type MenuItem = Tables<'menu_items'>
type DailySpecial = Tables<'daily_specials'>

interface RestaurantAppProps {
  restaurant: Restaurant
  categories: Category[]
  menuItems: MenuItem[]
  starters: MenuItem[]
  dailySpecial: DailySpecial | null
  tableNumber: string
}

export default function RestaurantApp(props: RestaurantAppProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')

  function handleSessionReady(token: string, name: string) {
    setSessionToken(token)
    setCustomerName(name)
  }

  if (!sessionToken) {
    return (
      <SessionScreen
        restaurant={props.restaurant}
        tableNumber={props.tableNumber}
        starters={props.starters}
        onSessionReady={handleSessionReady}
      />
    )
  }

  return (
    <MenuClient
      {...props}
      sessionToken={sessionToken}
      customerName={customerName}
    />
  )
}