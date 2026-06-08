import SearchResult from '@/components/SearchResult';
import { useRouter } from 'next/router';
import React, { Suspense } from 'react'

const index = () => {
    const router = useRouter();
    const {q} = router.query;
  return (
    <div className='flex-1 p-3 sm:p-4 md:p-6 min-w-0'>
        <div className='max-w-6xl mx-auto'>
            {q && (
                <div className='mb-4 sm:mb-6'>
                    <h1 className='text-lg sm:text-2xl font-medium mb-3 sm:mb-4 break-words'>Search results for &quot;{q}&quot;</h1>
                </div>
            )}
            <Suspense fallback={<div>Loading...</div>}>
                <SearchResult query={q || ""} />
            </Suspense>
        </div>
    </div>
  )
}

export default index
