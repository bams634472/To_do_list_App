// const first_value = document.querySelector('#start_date');
// const last_value = document.querySelector('#last_date');
// const full_details = [date_values,text_values,last_values];

const button = document.getElementById('submit-btn');
const text = document.getElementById('text');
const grocery = document.querySelector('.grocery-list');
const container = document.querySelector(".grocery-container");
const grocery_list = document.querySelectorAll(".grocery-item");

const Alert = document.querySelector('#alert');
const Toggle = document.querySelector('.toggleBtn')
// console.log(show);



let editElement;
let editFlag = false;
let editID = "";

button.addEventListener("click", Add_items);
window.addEventListener("DOMContentLoaded", setupItems); 

// Add_items function add value to the screen
function Add_items(e){
     e.preventDefault();

    // get the text value
     const value = text.value;
    
     // convert date into a string
     const id = new Date().toString();
    //checking if the value is true && editflag is false
    // if(value && !editFlag){
                //create list item
                 create_list(id, value)
                //  console.log(value);
                //display alert
                // displayAlert("item added to the list", "success");

                // show container
                // container.classList.add("show-container")
                // add to local storagae
                addToLocalStorage(id, value);
                // getLocalStorage(id, value);
                
                // set back to default
                // setupItems();
                Edit_btn

                setDefault(value);


    // }

    // prevent default behaivour;

}


 function delete_btn(e, n) {
    //    const element = e.currentTarget.parentElement.parentElement;
        const delete_button = e.querySelector(".delete-btn");
           
    //    grocery.removeChild(element)
    //    setDefault()
    // console.log(localStorage.getItem("task"))
       delete_button.addEventListener("click", function(j) {
         grocery.removeChild(e);
           let items = JSON.parse(localStorage.getItem("task"));
        //    console.log(j.currentTarget.parentElement.parentElement)
        //         let item = [items]

             items = items.filter(function (item) {
            //    if (items.IDs !== n) {
                //   JSON.stringify(localStorage.removeItem("task"));
                 


        //     //    }

           });

    })
}

function Edit_btn(e){
    const edit_button = e.querySelector(".edit-btn");
    // editElement = e.currentTarget.parentElement.previousElementSibling;
    editElement = e.querySelector("span").innerHTML;
    // text.value = editElement;

    edit_button.addEventListener('click', function(j){
        // console.log(e.querySelector("span").innerHTML);
       

        console.log(j.currentTarget);
        text.value = editElement = e.querySelector("span").innerHTML;
        button.innerHTML = "Edit";
        button.addEventListener("click", function(){
            if(button.innerHTML == "Edit"){
                console.log(text.value)
            }
        })

    })
}

    // create a innerHTML
    function create_list(IDs, Value) {
            //create an article element
            const element = document.createElement("article");
            // element.setAttribute("data-id", id);
            element.classList.add("grocery-item");
            element.innerHTML = `
                <p>${IDs} </p>
                <span>${Value} </span>
            
            <div class="btn-container">
                                    <!-- edit btn -->
                                    <button type="button" class="edit-btn">
                                        <i class="fas fa-edit">Edit</i>
                                    </button>
                                    <!-- delete btn -->
                                    <button type="button" class="delete-btn">
                                        <i class="fas fa-trash">delete</i>
                                    </button>
                                </div>
                    `;
            //put the child element inside the grocery container



           

                // console.log(delete_button);
            // delete_button.addEventListener("click", delete_btn)
            grocery.appendChild(element);

                   


       
        }



   function addToLocalStorage(IDs, Value){
    //create and object of both IDs and Value
        let grocery = {IDs, Value}

            //check if localstorage is empty
        if (localStorage.getItem("task") === null) {
            //create an array
            var grocerys = [];
                //push the object grocery to grocerys array;
            grocerys.push(grocery);
            
            // set the local storage item
        localStorage.setItem("task", JSON.stringify(grocerys));

        }
        //check if localstorage is not empty
        else {
            var grocerys = JSON.parse(localStorage.getItem("task"));
                  //push the object grocery to grocerys array;
            //       console.log(typeof grocerys);
            grocerys.push(grocery);
                            // set the local storage item

            localStorage.setItem("task", JSON.stringify(grocerys));

        }           
            
    }

 function setupItems() {
    // let bookmark equal to localstorage task
   let bookmark = JSON.parse(localStorage.getItem("task"));

   // check if bookmark length is less than 0
   if(bookmark.length > 0){
        //loop through bookmark array
        bookmark.forEach(function(item){
            // call the create_list function and set the item
            create_list(item.IDs, item.Value)
        
        })

    }}
 
    // set text.value to empty string
    function setDefault(values) {     
        // text.value is equal to empty string   
        text.value = " ";
    }

   
    Toggle.addEventListener('click', (e) => {
  document.documentElement.classList.toggle('dark-theme');
//   console.log(e.target);
  let checkClasslist = document.querySelector(".grocery-list");
        if (checkClasslist.classList.contains("white-theme")){
            checkClasslist.classList.remove('white-theme');
                Toggle.innerHTML = "Dark-mode"
                

        } else {
            checkClasslist.classList.add("white-theme");
            Toggle.innerHTML = "Light-mode"

        }
    });


    




//  setInterval()
    //  function editButton(){
        // console.log(document.querySelectorAll(".title"), alert)}
//    , 10000);