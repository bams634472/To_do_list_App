// import Navbar from "./component/Navbar"
// import Hero from "./component/Hero"
// import HomeCards from "./component/HomeCards"


const App = () => {
  return (
    <>           
                <div className="container">
                  <button type="submit" className="toggleBtn">Dark-mode</button>
                  <article className="container-section">
                    <h1>What are you upto today</h1>
                    <p className="alert"></p>
                    <form action="" id="ToDoList_section">
                      <div className="section_item">

                        <textarea id="text" name="event" rows="10" cols="50">
                        </textarea>
                      </div>
                      <button type="submit" id="submit-btn">Add_list</button>
                    </form>
                  </article>

                </div>

           
              <div className="grocery-container">
                <div className="grocery-list">


                </div>
              </div>   

      </>
  )
}

export default App;
