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


document.addEventListener("keypress", keyboard_Press)

function keyboard_Press(type) {
    
        const eventKey = type.key;
        if (eventKey === "Enter") {
            Add_items(type)

        }
        else {
           removeEventListener("keypress", keyboard_Press)
        }
    }


// Add_items function add value to the screen
function Add_items(e) {
    e.preventDefault();
    // console.log(e)
    const value = text.value.trim();
     if (!value) return;

     if (editFlag && editID) {
         const item = grocery.querySelector(`[data-id="${editID}"]`);

         if (item) {
             item.querySelector('span').textContent = value;

             const storedItems = JSON.parse(localStorage.getItem("task") || "[]");
             const itemIndex = storedItems.findIndex((task) => task.IDs === editID);

             if (itemIndex !== -1) {
                 storedItems[itemIndex].Value = value;
                 localStorage.setItem("task", JSON.stringify(storedItems));
             }
         }

         editFlag = false;
         editID = "";
         setDefault();
         displayAlert()
         return;
     }
    const id = new Date().toString();

    
    create_list(id, value);
    addToLocalStorage(id, value);
    setDefault();
}



function delete_btn(e) {
    const delete_button = e.querySelector(".delete-btn");
    //  console.log(grocery)

    delete_button.addEventListener("click", function () {
        const storedItems = JSON.parse(localStorage.getItem("task") || "[]");
        const updatedItems = storedItems.filter((item) => item.IDs !== e.dataset.id);

        localStorage.setItem("task", JSON.stringify(updatedItems));
        e.remove();
    });
}


function Edit_btn(e) {
    const edit_button = e.querySelector(".edit-btn");


    edit_button.addEventListener('click', function () {
        editFlag = true;
        editID = e.dataset.id;
        text.value = e.querySelector("span").textContent.trim();
        button.textContent = "Edit Item";


    });
    // console.log("ksld")
}

// create a innerHTML
function create_list(IDs, Value) {
    //create an article element
    const element = document.createElement("article");
    element.dataset.id = IDs;
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
    grocery.appendChild(element);
    delete_btn(element);
    Edit_btn(element);
}



function addToLocalStorage(IDs, Value) {
    //create and object of both IDs and Value
    let grocery = { IDs, Value }

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
    if (bookmark.length > 0) {
        //loop through bookmark array
        bookmark.forEach(function (item) {
            // call the create_list function and set the item
            create_list(item.IDs, item.Value)

        })

    }
}

// set text.value to empty string
function setDefault() {
    text.value = "";
    button.textContent = "Submit";
}

function displayAlert() {
    let alert = document.querySelector("#alert");
    console.log(alert);
}

// displayAlert();



Toggle.addEventListener('click', () => {
    const root = document.documentElement;
    const groceryList = document.querySelector('.grocery-list');
    const isDarkTheme = root.classList.toggle('dark-theme');

    groceryList.classList.toggle('white-theme', !isDarkTheme);
    Toggle.textContent = isDarkTheme ? 'Dark-mode' : 'Light-mode';
});







//  setInterval()
//  function editButton(){
// console.log(document.querySelectorAll(".title"), alert)}
//    , 10000);