

// Config doesnt change over time,
// gamestages do
let config = {
    "vampire": {
        "num_actions": 15,
        "blood_needed_for_day": 4,
    },

    // New health system (probability-based)
    // Each villager has 3 possible states: dead <- sick <-> healthy
    // healthy -> sick: 
    //      based on amount of blood lost (e.g. mam 3 / 5 blood: blood_lost = 2)
    //      lost_blood is used to lookup the probability that this villager gets sick
    //
    // sick -> healthy:
    //      Fixed probability to heal. Simple for now.
    //      Strawberry heals?
    
    "get_sick": [0, 0.3, 0.5, 0.8, 0.8, 1.0, 1.0, 1.0, 1.0], // e.g. A villager with 2 blood_lost has a probability of 50% to get sick
    "get_healthy": 0.5,

    // Blood healed per round:
    // e.g.If villager is healthy: [1, 2]   We randomly pick one from this list
    "heal_healthy": [1, 2],
    "heal_sick": [0, 1],
    
    "villager": {
        1: {"blood_max": 5},
        2: {"blood_max": 3},
        3: {"blood_max": 2},
        4: {"blood_max": 6},
    }
};

let vampire_gamestage = {
    "action_left": 15,
    "current_position_vampire": 0,
    "blood_absorbed_today": 0,
    "blood_absorbed_alltime": 0,
    "strawberry_count": 0,
    "left_castle": false
};

let villager_gamestage = {
    1: {"blood": 5, "state": "healthy"},    
    2: {"blood": 3, "state": "healthy"},
    3: {"blood": 2, "state": "healthy"},
    4: {"blood": 6, "state": "healthy"}
};


function random_choice(array){
    return array[Math.floor(Math.random() * array.length)]
}

function update_villager_health_end_of_round(){
    for (let ind = 1; ind < 5; ind++) {
        let villager = villager_gamestage[ind];

        state = get_villager_state(ind);

        // First we check if this villager transistions to another health state
        if (state == "healthy"){
            // Villager could get sick (certain probability)
            let blood_lost = config["villager"][ind]["blood_max"] - villager["blood"];
            let prob = config["get_sick"][blood_lost];
            if (Math.random() < prob){
                villager_gamestage[ind]["state"] = "sick"; // Update the state (is sick now)
            }
        } else if (state == "sick"){
            // Villager could get healthy
            if (Math.random() < config["get_healthy"]){
                villager_gamestage[ind]["state"] = "healthy";
            }
        }

        // Then we update the villager based on its state
        // Randomly choosing how much to heal
        state = get_villager_state(ind);
        if(state == "healthy"){
            villager_gamestage[ind]["blood"] += random_choice(config["heal_healthy"]);
        }
        if (state == "sick"){
            villager_gamestage[ind]["blood"] += random_choice(config["heal_sick"]);
        }
        if(state == "dead"){
            villager_gamestage[ind]["blood"] = 0;
        }

        max = config["villager"][ind]["blood_max"];

        if(villager_gamestage[ind]["blood"] > max){
            villager_gamestage[ind]["blood"] = max;
        }
    }
        
}

function get_villager_state(ind){
    if (villager_gamestage[ind]["blood"] == 0){
        villager_gamestage[ind]["state"] = "dead";
    }
    return villager_gamestage[ind]["state"]
    // blood_content = villager_gamestage[ind]["blood"];
    // blood_content_upper = config["villager"][ind]["blood_max"];
    // blood_content_threshold = blood_content_upper - 1;
    
    // if(blood_content_threshold<=blood_content && blood_content <= blood_content_upper){
    //     return "healthy";
    // }
    // if(1<=blood_content&&blood_content<blood_content_threshold){
    //     return "sick";
    // }
    // if(blood_content<=0){
    //     return "dead";
    // }
}

function game_over(){
    do_it = false;
    if(vampire_gamestage["action_left"]<=0){
        do_it = true;
    }
    if(vampire_gamestage["current_position_vampire"]==0 && vampire_gamestage["left_castle"]==true){
        do_it = true;
    }  

    // Round is over. Do some accounting
    if (do_it) {
        // Blood every round
        vampire_gamestage["blood_absorbed_alltime"] -= config["vampire"]["blood_needed_for_day"];

        // blood to go home
        extra_blood = vampire_gamestage["current_position_vampire"] - vampire_gamestage["action_left"];

        if (extra_blood > 0) {
            vampire_gamestage["blood_absorbed_alltime"] -= extra_blood;
        }

        if(vampire_gamestage["blood_absorbed_alltime"]<0){
            console.log("GAME OVER")
            console.log("You starved")
            location.reload()
        }
        vampire_gamestage["current_position_vampire"]=0;
        vampire_gamestage["action_left"] = config["vampire"]["num_actions"];
        vampire_gamestage["left_castle"]=false;
        update_villager_health_end_of_round();
    }
}



function bite(){
    pos = vampire_gamestage["current_position_vampire"];
    if(villager_gamestage[pos]["blood"] > 0){
        villager_gamestage[pos]["blood"] -= 1;
        vampire_gamestage["blood_absorbed_alltime"] += 1;
        vampire_gamestage["blood_absorbed_today"] += 1;
        vampire_gamestage["action_left"] -= 2;
        game_over()
    }
    update_all();
}

function move(to_state){    
    vampire_gamestage["action_left"]-= Math.abs(vampire_gamestage["current_position_vampire"]-to_state)
    vampire_gamestage["current_position_vampire"]=to_state
    vampire_gamestage["left_castle"]=true;
    game_over()

    update_all();
}

function get_strawberry(){
    if(vampire_gamestage["blood_absorbed_alltime"]>=1 && vampire_gamestage["current_position_vampire"]==0){
        vampire_gamestage["strawberry_count"]+=1
        vampire_gamestage["blood_absorbed_alltime"]-=1;
        vampire_gamestage["action_left"]-=1;
        game_over()
    }
    update_all();

}

function give_strawberry(){
    pos = vampire_gamestage["current_position_vampire"];
    if(villager_gamestage[pos]["blood"] > 0 && vampire_gamestage["strawberry_count"]>0){
        villager_gamestage[pos]["blood"] += 3;
        // vampire_gamestage["action_left"]-=1;
        vampire_gamestage["strawberry_count"]-=1
        game_over()
    }
    update_all();
}


function update_all(){
    // Update all person positions: buttons, icons
    //update current VAmpire position
    position =vampire_gamestage["current_position_vampire"]
    for (let ind = 0; ind < 5; ind++) {
        if(position == ind){
            $("#p" + ind +"-here").show();
            $("#p" + ind +"-btn-move").hide();
        } else {
            $("#p" + ind +"-here").hide();
            $("#p" + ind +"-btn-move").show();
        }
    }

    // Update all villagers
    for (let ind = 1; ind < 5; ind++) {
        type = "";
        switch(ind){
            case 1: 
                type = "mam";
                break;
            case 2: 
                type = "teen";
                break;
            case 3: 
                type = "kid";
                break;
            case 4: 
                type = "dad";
                break;
        }

        state = get_villager_state(ind);
        if (state == "healthy") {
            state = "";
        } else { 
            state = "_" + state;
        }

        $("#p"+ind+"-img").attr("src", "Bilder/" + type + state + ".png");

        // Check if this villager is active (are the buttons visible)
        if (vampire_gamestage["current_position_vampire"] == ind){
            $("#p" + ind + "-btns").show();
        } else {
            $("#p" + ind + "-btns").hide();
        }
    }

    //update remaining steps
    $("#remaining_steps").text(vampire_gamestage["action_left"]);

    // update health of villager
    for (let ind = 1; ind < 5; ind++) {
        $("#health_pos"+ind).text(villager_gamestage[ind]["blood"]);
        $("#max_health_pos"+ind).text(config["villager"][ind]["blood_max"]);
    }

    //update strawberrycount and blood of vampire
    $("#blood_count_alltime").text(vampire_gamestage["blood_absorbed_alltime"]);
    $("#strawberry_count").text(vampire_gamestage["strawberry_count"]);

    // Update blood per round
    $("#blood_per_round").text(config["vampire"]["blood_needed_for_day"]);
}


