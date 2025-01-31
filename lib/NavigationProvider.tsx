"use client"

import { createContext, useContext, useState } from "react";

interface NavigationContextType {
    isMobileNavOpen: boolean;
    setIsMobileNavOpen: (open: boolean) => void;
    closeMobileNav: () => void;
}

export const NavigationContext = createContext<NavigationContextType>({
    isMobileNavOpen: false,
    setIsMobileNavOpen: () => {},
    closeMobileNav: () => {},
})

//navigation context/provider act as an wrapper over the entire app to dynaically change the state of the components

export function NavigationProvider({children}
    : 
    {children: React.ReactNode}) {

        const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

        const closeMobile = () => setIsMobileNavOpen(false);
        return (
        <NavigationContext
            value={{isMobileNavOpen, setIsMobileNavOpen, closeMobileNav: closeMobile}}

        >
            {children}
        </NavigationContext>
        )
}