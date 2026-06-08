import React, {useState} from 'react'
import { Button } from './ui/button';
const categories = [
    "All",
    "Music",
    "Gaming",
    "Movies",
    "News",
    "Sports",
    "Technology",
    "Comedy",
    "Education",
    "Science",
    "Travel",
    "Food",
    "Fashion"
]

const Categorytabs = () => {
    const [activeCategory, setActiveCategory] = useState("All");
  return (
    <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {categories.map((category)=>(
            <Button key={category}
             variant={activeCategory === category ? "default":"secondary"}
             className="whitespace-nowrap shrink-0 text-xs sm:text-sm"
             onClick={()=>setActiveCategory(category)}
             >
                {category}
             </Button>
        ))}
    </div>
  )
}

export default Categorytabs
