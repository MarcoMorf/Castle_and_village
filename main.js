
let round = 0;

// Config doesnt change over time,
// gamestages do
let config = {
    "vampire": {
        "start_blood": 0,
        "num_actions": {"summer": 11, "winter": 10},
        "blood_needed_for_day": {"summer": 3, "winter": 6},
        "move_time": 1,
        "bite_time": 1
    },
    
    "villager": {
        1: {"blood_max": 5},
        2: {"blood_max": 3},
        3: {"blood_max": 2},
        4: {"blood_max": 6},
    },

    // New health system (probability-based)
    // Each villager has 3 possible states: dead <- sick <-> healthy
    "get_sick": 0.275, // Probability to get sick, every bite
    "get_healthy": 0.4, // Probability to heal, at the end of the round

    // Blood healed per round:
    // e.g.If villager is healthy: [1, 2]   We randomly pick one from this list
    "heal_healthy": [1, 1, 2, 2, 2],
    "heal_sick": [-1, -1, 0, 0, 0, 0, 1],
    "heal_max": 4,

    //season config
    "length_season":{"summer": 4, "winter": 3},

    "grow_time": 2,

    "bite_cost_sick": [1, 1, 1, 2, 2]

};

function get_round_in_year(){
    return round % (config["length_season"]["summer"] + config["length_season"]["winter"]);
}

function get_round_in_season(){
    var r = get_round_in_year();
    var s = config["length_season"]["summer"];
    if (r >= s){
        r -= s;
    }
    return r
}

function get_season(){
    if (get_round_in_year() < config["length_season"]["summer"]) {
        return "summer"
    }
    else {
        return "winter"
    }
}


let vampire_gamestage = {
    "action_left": config["vampire"]["num_actions"][get_season()],
    "current_position_vampire": 0,
    "blood_alltime": 0,
    "blood": config["vampire"]["start_blood"],
    "strawberry_count": 0,
    "left_castle": false
};

let villager_gamestage = {
    1: {"blood": 5, "state": "healthy", "bitten": false, "healed": false},    
    2: {"blood": 3, "state": "healthy", "bitten": false, "healed": false},
    3: {"blood": 2, "state": "healthy", "bitten": false, "healed": false},
    4: {"blood": 6, "state": "healthy", "bitten": false, "healed": false}
};


let farm_gamestage = [-1, -1];

$( document ).ready(function() {
    update_all();
});



function random_choice(array){
    return array[Math.floor(Math.random() * array.length)]
}

function update_villager_health_end_of_round(){
    for (let ind = 1; ind < 5; ind++) {
        let villager = villager_gamestage[ind];

        state = get_villager_state(ind);

        // Sick villagers can heal at the end of the round
        if (state == "sick"){
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

        // Check if villager died
        if (villager_gamestage[ind]["blood"] <= 0){
            villager_gamestage[ind]["state"] = "dead";
            villager_gamestage[ind]["blood"] = 0;
        }

        // Update bitten & healed
        villager_gamestage[ind]["bitten"] = false;
        villager_gamestage[ind]["healed"] = false;
    }
        
}

function get_villager_state(ind){
    return villager_gamestage[ind]["state"]
}

function check_round_over(){
    do_it = false;
    if(vampire_gamestage["action_left"] <= 0){
        do_it = true;
    }
    if(vampire_gamestage["current_position_vampire"]==0 && vampire_gamestage["left_castle"]==true){
        do_it = true;
    }  

    // Round is over. Do some accounting
    if (do_it) {
        var season = get_season();

        // Blood every round
        vampire_gamestage["blood"] -= config["vampire"]["blood_needed_for_day"][season];

        // blood to go home

        // extra_blood = config["vampire"]["move_time"]; // vampire_gamestage["current_position_vampire"] - vampire_gamestage["action_left"];

        // if (extra_blood > 0) {
        //     vampire_gamestage["blood"] -= extra_blood;
        // }

        if(vampire_gamestage["blood"] < 0 || vampire_gamestage["current_position_vampire"] != 0 || villager_gamestage[1]["state"] == "dead" || villager_gamestage[4]["state"] == "dead"){
            alert("GAME OVER!");
            location.reload();
        }

        update_villager_health_end_of_round();

        // new round
        round += 1;
        var season_new = get_season();

        vampire_gamestage["current_position_vampire"] = 0;
        vampire_gamestage["action_left"] = config["vampire"]["num_actions"][season_new];
        vampire_gamestage["left_castle"] = false;

        // Strawberry farms
        for (var i = 0; i < 2; i++){
            if (farm_gamestage[i] != -1){
                farm_gamestage[i] += 1;
                // Harvest
                if (farm_gamestage[i] >= config["grow_time"]){
                    vampire_gamestage["strawberry_count"] += 1;
                    farm_gamestage[i] = -1;
                }
            }
        }

        if (round == 2 * (config["length_season"]["summer"] + config["length_season"]["winter"])){
            points = vampire_gamestage["blood_alltime"] - 60;
            update_all();
            alert("You won!\nSuch a successfull cannibal!\n\Blood: "+points);
        }

        //Year 2
        if (season_new == "summer" && season == "winter"){
            // New baby every summer
            villager_gamestage[3] = {"blood": 2, "state": "healthy", "bitten": false, "healed": false};
            config["villager"]["2"]["blood_max"] += 1;
        }

        

    }
}

function bite(){
    pos = vampire_gamestage["current_position_vampire"];
    if(villager_gamestage[pos]["blood"] > 0 && villager_gamestage[pos]["healed"] == false){
        bite_cost = 1;
        if (villager_gamestage[pos]["state"] == "sick"){
            bite_cost = random_choice(config["bite_cost_sick"])
        }
        villager_gamestage[pos]["blood"] -= bite_cost;
        villager_gamestage[pos]["bitten"] = true;

        vampire_gamestage["blood"] += 1;
        vampire_gamestage["blood_alltime"] += 1;
        vampire_gamestage["action_left"] -= config["vampire"]["bite_time"];
        
        // Can get sick
        if (Math.random() < config["get_sick"]){
            villager_gamestage[pos]["state"] = "sick"; // Update the state (is sick now)
        }

        // Check if villager died
        if (villager_gamestage[pos]["blood"] <= 0){
            villager_gamestage[pos]["state"] = "dead";
            villager_gamestage[pos]["blood"] = 0;
        }

        check_round_over()
    }
    update_all();
}

function move(to_state){
    if (to_state === vampire_gamestage["current_position_vampire"]) return;
    vampire_gamestage["action_left"] -= config["vampire"]["move_time"]; // Math.abs(vampire_gamestage["current_position_vampire"]-to_state)
    vampire_gamestage["current_position_vampire"] = to_state
    vampire_gamestage["left_castle"]=true;
    check_round_over()

    update_all();
}

function get_strawberry(){
    if(vampire_gamestage["blood"]>=1 && vampire_gamestage["current_position_vampire"]==0){
        vampire_gamestage["strawberry_count"]+=1
        vampire_gamestage["blood"]-=1;
        check_round_over()
    }
    update_all();

}

function give_strawberry(){
    pos = vampire_gamestage["current_position_vampire"];
    if(villager_gamestage[pos]["blood"] > 0 && vampire_gamestage["strawberry_count"] > 0 && villager_gamestage[pos]["bitten"] == false){

        villager_gamestage[pos]["blood"] += config["heal_max"];
        villager_gamestage[pos]["blood"] = Math.min(config["villager"][pos]["blood_max"], villager_gamestage[pos]["blood"]);

        villager_gamestage[pos]["state"] = "healthy";
        villager_gamestage[pos]["healed"] = true;
        vampire_gamestage["strawberry_count"]-=1
        check_round_over()
    }
    update_all();
}


function plant(field){
    if (vampire_gamestage["current_position_vampire"] == 0){
        if (farm_gamestage[field] == -1 && vampire_gamestage["blood"] > 0) {
            farm_gamestage[field] = 0;
            vampire_gamestage["blood"] -= 1;
        }
    }
    update_all();
}


function update_all(){
    // Update all person positions: buttons, icons
    //update current VAmpire position
    position = vampire_gamestage["current_position_vampire"]
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

        // Update buttons
        var villager = villager_gamestage[ind]
        if (!villager["healed"] && villager["state"] != "dead"){
            $("#bite" + ind).show();
        } else {
            $("#bite" + ind).hide();
        }

        if (!villager["bitten"] && villager["state"] != "dead" && vampire_gamestage["strawberry_count"] > 0){
            $("#give_strawberry" + ind).show();
        } else {
            $("#give_strawberry" + ind).hide();
        }
    }

    //update remaining steps
    $(".remaining_steps").text(vampire_gamestage["action_left"]);

    // update health of villager
    for (let ind = 1; ind < 5; ind++) {
        $("#health_pos"+ind).text(villager_gamestage[ind]["blood"]);
        $("#max_health_pos"+ind).text(config["villager"][ind]["blood_max"]);
    }

    //update strawberrycount and blood of vampire
    $("#blood_count_alltime").text(vampire_gamestage["blood"]);
    $("#strawberry_count").text(vampire_gamestage["strawberry_count"]);

    // Update blood per round
    $("#blood_per_round").text(config["vampire"]["blood_needed_for_day"][get_season()]);


    $("#season").text(get_season());
    $("#round").text((1 + get_round_in_season()) + " / " + config["length_season"][get_season()]);

    for (let ind = 0; ind < 2; ind++) {
        if (farm_gamestage[ind] != -1){
            $("#plant" + ind).addClass("planted");
        } else {
            $("#plant" + ind).removeClass("planted");
        }
    }
}


