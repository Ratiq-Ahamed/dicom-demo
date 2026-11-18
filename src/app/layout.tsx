import type { Metadata, Viewport } from 'next';
import './globals.css';
import './workflow.css';
export const metadata:Metadata={title:'DICOM Reporting Services | Workflow Demo',description:'Connected reporting, thoughtfully coordinated. A synthetic frontend demonstration.',manifest:'/manifest.webmanifest'};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#06162e'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body data-ui-version="attendance-table-v3">{children}</body></html>;}
