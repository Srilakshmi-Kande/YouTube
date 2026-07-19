import mongoose from "mongoose";
import users from "../Modals/Auth.js";

export const login = async(req,res) => {
    const {email,name,image} = req.body;
    try{
        const existinguser = await users.findOne({email});
        if(!existinguser){
            const newuser = await users.create({email,name,image});
            return res.status(201).json({result: newuser});
        } else {
            return res.status(200).json({result: existinguser});
        }
    }catch(error){
        console.log("logon error",error)
        return res.status(500).json({message: "Something went wrong"});
    }
}

export const getuser = async (req, res) => {
    const { id: _id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ message: "Invalid user id" });
    }
    try {
        const user = await users.findById(_id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ result: user });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export const updateprofile = async (req,res) => {
    const {id : _id} = req.params;
    const { channelname, description, city, state } = req.body;
    if(!mongoose.Types.ObjectId.isValid(_id)){
        return res.status(500).json({message: "User unavailable..."});
    }
    try{
        const updates = {};
        if (channelname !== undefined) updates.channelname = channelname;
        if (description !== undefined) updates.description = description;
        if (city !== undefined) updates.city = city;
        if (state !== undefined) updates.state = state;

        const updatedata = await users.findByIdAndUpdate(
            _id,
            { $set: updates },
            {new: true}
        );
        return res.status(201).json(updatedata);
    }catch(error){
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
}