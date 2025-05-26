
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
				'2xl': '1400px'
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
				// AI-Nature hybrid colors
				'bio-circuit': 'hsl(var(--bio-circuit))',
				'digital-flora': 'hsl(var(--digital-flora))',
				'energy-flow': 'hsl(var(--energy-flow))',
				'organic-tech': 'hsl(var(--organic-tech))',
				'photosynthesis': {
					start: 'hsl(var(--photosynthesis-start))',
					end: 'hsl(var(--photosynthesis-end))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Rajdhani', 'system-ui', '-apple-system', 'sans-serif'],
				orbitron: ['Orbitron', 'system-ui', '-apple-system', 'sans-serif'],
			},
			animation: {
				'tree-grow': 'tree-grow 10s ease-out forwards',
				'sway': 'sway 4s ease-in-out infinite',
				'data-rain': 'data-rain 3s linear infinite',
				'circuit-flow': 'circuit-flow 8s linear infinite',
				'circuit-pulse': 'circuit-pulse 6s ease-in-out infinite',
				'bloom': 'bloom 0.6s ease-out',
				'pollen-drift': 'pollen-drift 15s ease-in-out infinite',
				'photosynthesis-rise': 'photosynthesis-rise 8s ease-out infinite',
				'terrain-shift': 'terrain-shift 20s ease-in-out infinite',
				'lightning-flash': 'lightning-flash 8s ease-in-out infinite',
			},
			keyframes: {
				'tree-grow': {
					'0%': { 
						transform: 'scaleY(0) translateY(100px)', 
						opacity: '0' 
					},
					'100%': { 
						transform: 'scaleY(1) translateY(0)', 
						opacity: '0.6' 
					}
				},
				'sway': {
					'0%, 100%': { transform: 'rotate(-2deg)' },
					'50%': { transform: 'rotate(2deg)' }
				},
				'data-rain': {
					'0%': { 
						transform: 'translateY(-100vh) translateX(var(--x-drift, 0px))', 
						opacity: '0'
					},
					'10%': { opacity: '1' },
					'90%': { opacity: '1' },
					'100%': { 
						transform: 'translateY(100vh) translateX(calc(var(--x-drift, 0px) * -1))', 
						opacity: '0'
					}
				},
				'circuit-flow': {
					'0%': { backgroundPosition: '0 0' },
					'100%': { backgroundPosition: '40px 40px' }
				},
				'circuit-pulse': {
					'0%, 100%': { opacity: '0.2' },
					'50%': { opacity: '0.6' }
				},
				'bloom': {
					'0%': { transform: 'scale(1) rotateY(0deg)' },
					'50%': { transform: 'scale(1.05) rotateY(5deg)' },
					'100%': { transform: 'scale(1.02) rotateY(2deg)' }
				},
				'pollen-drift': {
					'0%': { 
						transform: 'translate(0, 0) rotate(0deg)', 
						opacity: '0'
					},
					'20%': { opacity: '1' },
					'80%': { opacity: '1' },
					'100%': { 
						transform: 'translate(200px, -100px) rotate(360deg)', 
						opacity: '0'
					}
				},
				'photosynthesis-rise': {
					'0%': { 
						transform: 'translateY(100px) scale(0.5)', 
						opacity: '0'
					},
					'50%': { 
						opacity: '1', 
						transform: 'translateY(50px) scale(1)'
					},
					'100%': { 
						transform: 'translateY(-100px) scale(0.3)', 
						opacity: '0'
					}
				},
				'terrain-shift': {
					'0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
					'33%': { transform: 'translate(50px, -30px) rotate(1deg)' },
					'66%': { transform: 'translate(-30px, 20px) rotate(-0.5deg)' }
				},
				'lightning-flash': {
					'0%, 90%, 100%': { opacity: '0' },
					'5%, 85%': { opacity: '1' }
				}
			},
			backgroundImage: {
				'photosynthesis-gradient': 'linear-gradient(135deg, hsl(var(--photosynthesis-start)), hsl(var(--photosynthesis-end)))',
				'bio-circuit': 'repeating-linear-gradient(90deg, transparent, transparent 2px, hsl(var(--bio-circuit)) 2px, hsl(var(--bio-circuit)) 4px), repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--bio-circuit)) 2px, hsl(var(--bio-circuit)) 4px)',
				'organic-flow': 'radial-gradient(ellipse 80% 60% at center, hsl(var(--primary)) 0%, transparent 70%)'
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'92': '23rem',
				'96': '24rem',
				'128': '32rem',
			},
			backdropBlur: {
				xs: '2px',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
