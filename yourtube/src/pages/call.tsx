import React from 'react';
import dynamic from 'next/dynamic';

const CallPage = dynamic(() => import('../components/CallPage'), { ssr: false });

export default function Call() {
  return <CallPage />;
}
