"use client"

import * as React from "react"

const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 mb-1 pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="border-[3px] border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  )
}

export { Tooltip }
