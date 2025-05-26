import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1200px',
				'2xl': '1200px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
			},
			fontSize: {
				base: '16px',
			},
			lineHeight: {
				base: '1.6',
			},
			letterSpacing: {
				tight: '-0.02em',
				normal: '-0.01em',
			},
			animation: {
				'subtle-fade': 'subtle-fade 0.6s ease-out forwards',
				'flow': 'flow 10s ease-in-out infinite',
				'progress': 'progress 2s ease-in-out infinite',
			},
			keyframes: {
				'subtle-fade': {
					'from': { 
						opacity: '0', 
						transform: 'translateY(10px)' 
					},
					'to': { 
						opacity: '1', 
						transform: 'translateY(0)' 
					}
				},
				'flow': {
					'0%, 100%': { 
						backgroundPosition: '0% 50%' 
					},
					'50%': { 
						backgroundPosition: '100% 50%' 
					}
				},
				'progress': {
					'0%': { 
						transform: 'translateX(-100%)' 
					},
					'100%': { 
						transform: 'translateX(100%)' 
					}
				}
			},
			spacing: {
				'18': '4.5rem',
			},
			transitionDuration: {
				'200': '200ms',
			},
			transitionTimingFunction: {
				'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;