
const path = require('path');
const http = require('http');
const express = require('express');
const {createGameState} = require("./game");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

//
let app  =express();

app.use(cors())
let server= http.createServer(app);
const io = require("socket.io")(server,{
    cors:{
        origin: `https://pendu-1vs1.web.app`, // I copied the origin in the error message and pasted here
        methods: ["GET", "POST"],
        credentials: true
    }
});


// const publicPath    = path.join(__dirname, '/public');
// app.use(express.static(publicPath));
const port =  process.env.PORT || 5001;
server.listen(port ,()=>{
    console.log(`server is running on ${port}`)
});


const userData = {}; // {socket.id:{username,room},...}
const roomUser = {};  //{room:["user1","user2"]}
const states = {}; // {room:gameState}

io.on("connection",socket =>{

    
   socket.on("newUser",handleNewUser);
   socket.on("getRooms",handlerGetRooms);
   socket.on("disconnect",handleDisconnect);
   socket.on("readyToStartTheGame",handleReadyToStartTheGame);
   socket.on("clientSendQuestion",handleClientSendQuestion);
   socket.on("clientLetterPressed",handleClientLetterPressed);
   socket.on("messageClientServer",handleMessageClientServer);
   
     
   

   function handleNewUser(data,cb){
      
       if(roomUser.hasOwnProperty(data.room)&&roomUser[data.room].length>=2)
       {
           socket.emit("error","sorry the room: "+data.room+" is full try another one");
           return;

       }
       let number = 1;
       if(roomUser.hasOwnProperty(data.room)&&roomUser[data.room].length===1){
           number = 2;
       }
       
     

       userData[socket.id] = data;
      if (!roomUser[data.room])   roomUser[data.room] = [];
      roomUser[data.room].push(data.username);
       socket.join(data.room);
       setTimeout(()=>{
        socket.emit("playerData",{number:number,username:data.username});
       },0) //waint until the app component is rendered login will be hidden and game and chatbox will show
      
       socket.number = number;
 
       cb();

       if(number ===2){
           io.in(data.room).emit("playersNames",roomUser[data.room]);
           states[data.room] = createGameState();
           
           
                io.in(data.room).emit("startGame");
           
            
         
         
          
       }

       console.log("roomUser:\n",roomUser);
       console.log("userData:\n",userData);
       console.log("states:\n",states);
   }
function handlerGetRooms(cb){
    
        io.emit("sendRooms",roomUser); // Object.keys(roomUser) in an array of rooms
        cb();
       
  
    
}
function handleDisconnect(){
    console.log(userData[socket.id]+"has disconnected............");
    if(userData.hasOwnProperty(socket.id)){
        if(roomUser.hasOwnProperty(userData[socket.id].room)){
           const usersInRoom = roomUser[userData[socket.id].room];
           usersInRoom.splice(usersInRoom.indexOf(userData[socket.id].user),1)
           if(roomUser[userData[socket.id].room].length===0){
               delete roomUser[userData[socket.id].room];
           }
           const room =userData[socket.id].room;
           if(states.hasOwnProperty(room)){
               
               delete states[room];
               io.in(room).emit("goOut");
           }
        }
       
        delete userData[socket.id];
    }
    
    
    
    console.log("roomUser:\n",roomUser);
    console.log("userData:\n",userData);
    console.log("states:\n",states);

  

} 

function handleReadyToStartTheGame(cb){
    cb();
            
  
        io.to(socket.id).emit("serverGetQuestion");
   
         
        
           
       
        
   
   
    
    console.log("ready...",userData[socket.id])

}


function handleClientSendQuestion(question){
     const room = userData[socket.id].room;
     const ennemy = states[room].players[(socket.number-1)===0?1:0];
     const player = states[room].players[socket.number-1];
     ennemy.question = question;
     
     console.log("state:",states[room].players);
  
     io.in(room).emit("serverSendQuestion",states[room].players);
      
     
}
function handleClientLetterPressed(letterInfo){
  const  {currentLetter,letter} = letterInfo;
  const room = userData[socket.id].room;
  const player = states[room].players[socket.number-1];
  let word =player.question.word;

   if(currentLetter ===word.length){
           

            return;
            
        }
    if(letter === word.charAt(currentLetter)){
              word = word.substr(0,currentLetter)+letter+word.substr(currentLetter+letter.length);
              player.question.word = word;
              player.currentLetter = currentLetter+1;
         
           
            player.score += 1;
           
        }
    else{
           
            player.score -= 1;
            
    }

       
    if(currentLetter ===word.length-1){
                //word is found
               player.question = {word:"",desc:""};
               player.currentLetter = 0;

               io.to(room).emit("playersUpdate",states[room].players);
              
                socket.to(room).emit("serverGetQuestion")
           
               
               return;
                
    }

    io.to(room).emit("playersUpdate",states[room].players);
  
}
function handleMessageClientServer(message){
    const room = userData[socket.id].room;
    socket.to(room).emit("messageServerClient",message);
}
})



