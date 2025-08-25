import { useState } from "react"
import { downloadFile } from "../../../../utils/downloadFile.js";

function StadiumPickPopup({ room, showPopup }) {
    const [stadiumSelected, setStadiumSelected] = useState(null)
    console.log(stadiumSelected)
    const handlePick = () => {
        room.setCurrentStadium(stadiumSelected)
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

return (
    <div className="dialog pick-stadium-view">
        <h1>Pick a stadium</h1>
        <div className="splitter">
            <div className="list ps">
                {window.API.Utils.getDefaultStadiums().map((stadium) =>
                    <div onClick={() => setStadiumSelected(stadium)} className="elem">{stadium.name}</div>
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