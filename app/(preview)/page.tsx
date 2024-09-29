'use client'

import { ReactNode, useRef, useState } from "react"
import { useActions } from "ai/rsc"
import { Message } from "@/components/message"
import { useScrollToBottom } from "@/components/use-scroll-to-bottom"
import { motion, AnimatePresence } from "framer-motion"
import { MasonryIcon, VercelIcon } from "@/components/icons"
import Link from "next/link"
import { Home, Lightbulb, Thermometer, Camera, Droplet, Zap } from 'lucide-react'

export default function Home1() {
  const { sendMessage } = useActions()

  const [input, setInput] = useState<string>("")
  const [messages, setMessages] = useState<Array<ReactNode>>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>()

  const suggestedActions = [
    { icon: <Camera className="w-5 h-5" />, title: "View all", label: "my cameras", action: "View all my cameras" },
    { icon: <Home className="w-5 h-5" />, title: "Show me", label: "my smart home hub", action: "Show me my smart home hub" },
    { icon: <Zap className="w-5 h-5" />, title: "How much", label: "electricity used this month?", action: "Show electricity usage" },
    { icon: <Droplet className="w-5 h-5" />, title: "How much", label: "water used this month?", action: "Show water usage" },
  ]

  return (
    <div className="flex flex-col justify-between min-h-dvh bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">SmartHome AI</h1>
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            <Thermometer className="w-6 h-6 text-red-500" />
            <Camera className="w-6 h-6 text-green-500" />
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-hidden flex flex-col">
        <div className="max-w-4xl mx-auto p-4 flex-grow flex flex-col">
          <div
            ref={messagesContainerRef}
            className="flex-grow overflow-y-auto space-y-4 pb-4"
          >
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4"
                >
                  <h2 className="text-xl font-semibold mb-4 text-indigo-600 dark:text-indigo-400">Welcome to Your Smart Home Assistant</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Im here to help you manage your smart home. Ask me anything about your devices, energy usage, or home automation!
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-gray-400">
                    <VercelIcon size={20} />
                    <span>+</span>
                    <MasonryIcon  />
                  </div>
                </motion.div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {message}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Suggested Actions:</h3>
            <div className="grid grid-cols-2 gap-2">
              {suggestedActions.map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={async () => {
                    setMessages((messages) => [
                      ...messages,
                      <Message key={messages.length} role="user" content={action.action} />,
                    ])
                    const response: ReactNode = await sendMessage(action.action)
                    setMessages((messages) => [...messages, response])
                  }}
                  className="flex items-center space-x-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex-shrink-0 text-indigo-500 dark:text-indigo-400">
                    {action.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{action.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{action.label}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
          <form
            className="flex items-center space-x-2"
            onSubmit={async (event) => {
              event.preventDefault()
              setMessages((messages) => [
                ...messages,
                <Message key={messages.length} role="user" content={input} />,
              ])
              setInput("")
              const response: ReactNode = await sendMessage(input)
              setMessages((messages) => [...messages, response])
            }}
          >
            <input
              ref={inputRef}
              className="flex-grow bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-800 dark:text-gray-200"
              placeholder="Ask your smart home assistant..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button
            title="fe"
              type="submit"
              className="bg-indigo-500 text-white rounded-full p-2 hover:bg-indigo-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </footer>
    </div>
  )
}