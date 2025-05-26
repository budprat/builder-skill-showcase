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
			padding: '32px',
			screens: {
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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Swiss Design Colors
				'swiss-red': 'hsl(var(--accent))',
				'swiss-gray-light': 'hsl(var(--secondary))',
				'swiss-gray-medium': 'hsl(var(--muted))',
				'swiss-gray-dark': 'hsl(var(--border))',
			},
			borderRadius: {
				none: '0',
				DEFAULT: '0',
			},
			fontFamily: {
				sans: ['Helvetica', 'Arial', 'sans-serif'],
				helvetica: ['Helvetica', 'Arial', 'sans-serif'],
			},
			fontSize: {
				// Swiss typography scale - only allowed sizes
				'12': ['12px', { lineHeight: '1.5' }],
				'16': ['16px', { lineHeight: '1.5' }],
				'24': ['24px', { lineHeight: '1.5' }],
				'48': ['48px', { lineHeight: '1.5' }],
			},
			fontWeight: {
				// Only two weights allowed
				normal: '400',
				bold: '700',
			},
			spacing: {
				// 8-point grid system
				'1': '8px',    // 1 grid unit
				'2': '16px',   // 2 grid units
				'3': '24px',   // 3 grid units
				'4': '32px',   // 4 grid units
				'6': '48px',   // 6 grid units
				'8': '64px',   // 8 grid units
				'12': '96px',  // 12 grid units
				'16': '128px', // 16 grid units
			},
			gap: {
				// 8-point grid gaps
				'1': '8px',
				'2': '16px',
				'3': '24px',
				'4': '32px',
				'6': '48px',
				'8': '64px',
			},
			padding: {
				// 8-point grid padding
				'1': '8px',
				'2': '16px',
				'3': '24px',
				'4': '32px',
				'6': '48px',
				'8': '64px',
			},
			margin: {
				// 8-point grid margins
				'1': '8px',
				'2': '16px',
				'3': '24px',
				'4': '32px',
				'6': '48px',
				'8': '64px',
			},
			keyframes: {
				'slide-in': {
					from: { transform: 'translateX(-100%)' },
					to: { transform: 'translateX(0)' }
				},
			},
			animation: {
				'slide-in': 'slide-in 300ms cubic-bezier(0.4, 0, 0.6, 1)',
			},
			transitionTimingFunction: {
				'swiss': 'cubic-bezier(0.4, 0, 0.6, 1)',
			},
			transitionDuration: {
				'swiss': '200ms',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;