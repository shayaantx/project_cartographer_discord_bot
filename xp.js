const fs = require('fs');

class XP {
    
   constructor(xpFile) {
       this.xpFile = xpFile;
   } 

   ready() {
       this.checkIfXpFileExists();
       console.log("XP segment up and running.");
   }

   //check if the file with JSON data exists
   checkIfXpFileExists() {
       try{
           if (!fs.existsSync(this.xpFile)) {
               const xpData = {"xpData" : []};
               const data = JSON.stringify(xpData);
               fs.writeFileSync(this.xpFile, data);
           }
       }	
	   catch(err) {
           console.log("Unable to create XP File");
	       console.error(err);
	   }
   }
   
   //Check if a user wrote the message as opposed to a bot or discord itself
   checkIfMessageValid(message, botUserId) {
       if(!message.guild) return false;
	   if(message.author.bot) return false;	
	   if(message.system) return false;
       if(message.toString().charAt(0) === '!') return false;
       if(message.author.id == botUserId) return false;
       return true;
   }

   lookupXpData(data, message) {
       for(var index in data.xpData){
           //we found the user data in the JSON file
           if(data.xpData[index].id === message.author.id) {
               let levelInfo = data.xpData[index].level;
               let levelUp = false;
               // increment messages
               data.xpData[index].numMessages = data.xpData[index].numMessages + 1; 
               //if we've hit a new level
               if(data.xpData[index].numMessages >= data.xpData[index].messagesRequiredToNextLevel) { 
                   levelInfo = levelInfo + 1;
                   levelUp = true;
                   //increment level data
                   data.xpData[index].level = data.xpData[index].level + 1; 
                   if(levelInfo < 150){
                       // determines messages to the next level
                       data.xpData[index].messagesRequiredToNextLevel = data.xpData[index].messagesRequiredToNextLevel * (2 * Math.exp(-1 * ((levelInfo-1.7)/4)) + 1.02); 
                   }
                   else{
                       //past rank 150, flat 100 message increase to next level
                       data.xpData[index].messagesRequiredToNextLevel = data.xpData[index].messagesRequiredToNextLevel + 100; 
                   }
               }
               return {
                   result : true,
                   level : levelInfo,
                   levelup : levelUp,
                   data : data
               }
           }
       }
       return {
           result : false,
           level : 1,
           levelUp : false,
           data: data
       }
   }
   //Create new data for users who are new to the server
   createXpData(message, data) {
       const xpInformation = { 
           id: message.author.id,
           username: message.author.username,
           level: 1,
           numMessages: 1,
           messagesRequiredToNextLevel: 2
       };
       data.xpData.push(xpInformation);
       return data;
   }

   //looks up user data and updates it accordingly on new message events
   //returns true if level up
   updateXpData(message, botUserId, _callback) {
       if(this.checkIfMessageValid(message, botUserId)) {
           this.checkIfXpFileExists();
           fs.readFile(this.xpFile, (err, data) => {
               if (err) {
                   console.log("Unable to read XP File.");
                   throw err;
               } 
               let xpDataRead = JSON.parse(data);
               const lookup = this.lookupXpData(xpDataRead, message);
               let xpWrite = lookup['data'];
               if(!lookup['result']) {
                   xpWrite = this.createXpData(message, xpDataRead);
               }
               if(xpDataRead){
                   const data = JSON.stringify(xpWrite);
                   fs.writeFile(this.xpFile, data, (err) => { 
                       if (err){
                           console.log("Unable to write to XP File");
                           throw err;
                       } 
                   });
                   if(lookup['levelup']) {
                       _callback(lookup['level']);
                   }
                   
               }
           });          
       }
   }
}

module.exports = XP;