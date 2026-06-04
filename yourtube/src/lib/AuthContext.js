import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useContext, useState } from "react";
import { createContext } from "react";
import { auth, provider } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({children}) => {
    const [user,setUser] = useState(null);

    const login = (userdata) => {
        setUser(userdata);
        localStorage.setItem("user", JSON.stringify(userdata));
    }
    const logout =async () => {
        setUser(null);
        localStorage.removeItem("user");
        try{
            await signOut(auth);
        }catch(error){
            console.error("Error during sign out:", error);
        }
    };

    const handlegooglesignin = async() => {
        try{
            const result = await signInWithPopup(auth, provider);
            const firebaseuser = result.user;
            const payload={
                email: firebaseuser.email,
                name: firebaseuser.displayName,
                image: firebaseuser.photoURL || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTETU6oOlq2-7Sm_KLEf-N__TGnd7sIyKuz1w&s"
            };
            const response = await axiosInstance.post("/user/login",payload)
            login(response.data.result);
        }catch(error){
            console.error(error);
        }
    };
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseuser) => {
            if(firebaseuser){
                try{
                    const payload={
                        email: firebaseuser.email,
                        name: firebaseuser.displayName,
                        image: firebaseuser.photoURL || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTETU6oOlq2-7Sm_KLEf-N__TGnd7sIyKuz1w&s"
                    };
                    const response = await axiosInstance.post("/user/login",payload)
                    login(response.data.result);
                }catch(error){
                    console.error(error);
                    logout();
                }
            }
        }
        );
        return () => unsubscribe();
    },[]);
    
    return (
        <UserContext.Provider value={{user,login,logout,handlegooglesignin}}>  
            {children}
        </UserContext.Provider>
    )
};

export const useUser = () => useContext(UserContext);