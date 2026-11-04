import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata:Metadata={title:'DICOM Reporting Services | Workflow Demo',description:'Connected reporting, thoughtfully coordinated. A synthetic frontend demonstration.',manifest:'/manifest.webmanifest'};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#06162e'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
