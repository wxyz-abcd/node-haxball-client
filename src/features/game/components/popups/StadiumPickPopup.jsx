import { useState } from "react"
import { downloadFile } from "../../../../utils/downloadFile.js";

function StadiumPickPopup({ room, showPopup }) {
    const [stadiumSelected, setStadiumSelected] = useState(null);
    const [stadiumList, setStadiumList] = useState([]);
    const handlePick = () => {
        let stadiumObj;
        if (typeof stadiumSelected == "string") {
            stadiumObj = window.API.Utils.parseStadium(stadiumSelected);
        } else {
            stadiumObj = stadiumSelected;
        }
        room.setCurrentStadium(stadiumObj)
        showPopup(null)
    }

    const handleDelete = () => {
        //has to delete the stored stadium
    }

    const fileSumbit = (e) => {
        const selectedFile = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const stadiumObj = window.API.Utils.parseStadium(e.target.result);
            room.setCurrentStadium(stadiumObj)
        };
        reader.readAsText(selectedFile);
    }

    const handleExport = () => {
        const stadiumHBS = window.API.Utils.exportStadium(stadiumSelected);
        downloadFile(stadiumSelected.name+'.hbs', 'text/plain', stadiumHBS)
    }

    const getStadiumList = () => {
        const defaultStadiums = window.API.Utils.getDefaultStadiums();
        const request = window.indexedDB.open("stadiums", 1);
        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("stadiums")) {
              db.createObjectStore("stadiums", { autoIncrement: true });
            }
        };
        request.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction("stadiums", "readonly");
            const objectStore = transaction.objectStore("stadiums");
            const getAllRequest = objectStore.getAll();
            getAllRequest.onsuccess = function (event) {
                const customStadiums = event.target.result;
                const parsedCustomStadiums = customStadiums.map((stadium) => {
                    if (typeof stadium == "string") {
                        return window.API.Utils.parseStadium(stadium);
                    } else {
                        return stadium;
                    }
                });
                const allStadiums = [...defaultStadiums, ...parsedCustomStadiums];
                setStadiumList(allStadiums);
            }
        };
    };

    useState(() => {
        getStadiumList();
    }, [])

return (
    <div className="dialog pick-stadium-view">
        <h1>Pick a stadium</h1>
        <div className="splitter">
            <div className="list ps">
                {stadiumList.map((stadium, index) =>
                    <div onClick={() => setStadiumSelected(stadium)} className={index > 9 ? "elem custom" : "elem"}>{stadium.name}</div>
                )}
            </div>
            <div className="buttons">
                <button onClick={handlePick} data-hook="pick" disabled={!stadiumSelected}>Pick</button>
                <button onClick={handleDelete} data-hook="delete" disabled={!stadiumSelected?.isCustom}>Delete</button>
                <div className="file-btn">
                    <label htmlFor={'stadfile'}>Load</label>
                    <input onChange={fileSumbit} id="stadfile" type="file" accept=".hbs,.json,.json5" data-hook="file"></input>
                </div>
                <button onClick={handleExport} data-hook="export" disabled={!stadiumSelected}>Export</button>
                <div className="spacer"></div>
                <button onClick={() => showPopup(null)} data-hook="cancel">Cancel</button>
            </div>
        </div>
    </div>
)
}

export default StadiumPickPopup