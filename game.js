
const createGameState = ()=>{
    const gameState = {

        players:[
            {
                question:{
                    word:"",
                    desc:""
                },
                score:0,
                currentLetter:0,
            
              

            },
            {
                question:{
                    word:"",
                    desc:"",
                },
                score:0,
                currentLetter:0,
                
            
            }
        ]

}
    return gameState;
}


module.exports = {createGameState};