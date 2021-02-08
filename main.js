
let vampire_gamestage = {"action_left":15,
                        "num_actions": 15,
                        "current_position_vampire":0,
                        "blood_absorbed_today":0,
                        "blood_absorbed_alltime":0,
                        "strawberry_count":0,
                        "blood_needed_for_day":4,
                        "left_castle":false};
let villager_gamestage ={"villager":{"human1":{"blood":{"current":5,
                                                        "max":5
                                                     },
                                            "position":1
                                            },
                                   "human2":{"blood":{"current":3,
                                                        "max":3
                                                     },
                                            "position":2
                                            },
                                   "human3":{"blood":{"current":2,
                                                        "max":2
                                                     },
                                            "position":3
                                            },
                                   "human4":{"blood":{"current":6,
                                                        "max":6
                                                     },
                                            "position":4
                                            }

                                    }

                        };


function update_villager_health_end_of_round(){
    for (let ind = 1; ind < 5; ind++) {
        var state = get_villager_state(ind);
        
        if(state == "healthy"){
            villager_gamestage["villager"]["human"+ind]["blood"]["current"] += 1;
        }
        if (state == "sick"){
            villager_gamestage["villager"]["human"+ind]["blood"]["current"] += 0;
        }
        if(state == "dead"){
            villager_gamestage["villager"]["human"+ind]["blood"]["current"]=0;
        }
        max=villager_gamestage["villager"]["human"+ind]["blood"]["max"]
        if(villager_gamestage["villager"]["human"+ind]["blood"]["current"]>max){
            villager_gamestage["villager"]["human"+ind]["blood"]["current"]=max;

        }
    }
        
}

function get_villager_state(ind){
    var vblood = villager_gamestage["villager"]["human"+ind]["blood"]
    blood_content = vblood["current"];
    blood_content_upper = vblood["max"];
    blood_content_threshold = blood_content_upper - 1;
    
    if(blood_content_threshold<=blood_content && blood_content <= blood_content_upper){
        return "healthy";
    }
    if(1<=blood_content&&blood_content<blood_content_threshold){
        return "sick";
    }
    if(blood_content<=0){
        return "dead";
    }
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
        vampire_gamestage["blood_absorbed_alltime"] -= vampire_gamestage["blood_needed_for_day"];

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
        vampire_gamestage["action_left"] = vampire_gamestage["num_actions"];
        vampire_gamestage["left_castle"]=false;
        update_villager_health_end_of_round();
    }
}



function bite(){
    pos = vampire_gamestage["current_position_vampire"];
    if(villager_gamestage["villager"]["human"+pos]["blood"]["current"]>0){
        villager_gamestage["villager"]["human"+pos]["blood"]["current"]-=1;
        vampire_gamestage["blood_absorbed_alltime"]+=1;
        vampire_gamestage["blood_absorbed_today"]+=1;
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
    if(villager_gamestage["villager"]["human"+pos]["blood"]["current"]>0 && vampire_gamestage["strawberry_count"]>0){
        villager_gamestage["villager"]["human"+pos]["blood"]["current"]+=3;
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
        villager = villager_gamestage["villager"]["human"+ind];

        type = "";
        switch(villager["position"]){
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
        $("#health_pos"+ind).text(villager_gamestage["villager"]["human"+ind]["blood"]["current"]);
        $("#max_health_pos"+ind).text(villager_gamestage["villager"]["human"+ind]["blood"]["max"]);
    }

    //update strawberrycount and blood of vampire
    $("#blood_count_alltime").text(vampire_gamestage["blood_absorbed_alltime"]);
    $("#strawberry_count").text(vampire_gamestage["strawberry_count"]);

    // Update blood per round
    $("#blood_per_round").text(vampire_gamestage["blood_needed_for_day"]);


}


