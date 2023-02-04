import document from "document";
import { me } from "appbit";

const debug=true;

/*Parameters for DialogSetup and DialogShow are identical except the Key parameter is dropped
  for the DialogShow method: 
         Question: Max about 50 characters. Max of 2 lines. 
                   Note: If the question is short you can push it down to the second line
                   by starting it with \n.
      Dialog Type: "YN", "YNC", "OK", "OKC" Default is YN.
   Default Button: Values:Y or N This is the button that will be highlighed in the YNC type.
Callback Function: The function that will be executed when the user presses a button.
                   Pass in an empty string if there's no need for any action. Cancel is often
				           setup this way.  Annonymous functions can also be passed in.  See the 
				           AnsSaveNo() function for an  example.
				           The callback function is passed a string inidicating which button was pressed: 
				            "Y", "N", "OK" or "C".
     Physical Key: Use this to capture the pushed event for one of the physical keys.  If
                   you already have the pushed event captured, use the code in Dialog.js
                   as an example to capture the back button and NOT exit automatically.
                   The values are the same as the keys: back, up, down.
*/

//Call this method if you want to use one of the physical
// keys to show the dialog.
export function DialogSetup(Question,Type,DefaultAns,CallbackMethod,Key)
{
  if (Key != undefined && Key != "")
  {
    document.onkeypress = (evt) => 
    {
      if( evt.key == Key ){
        evt.preventDefault();
        //If the same key was pressed and the dialog is already displayed,
        //  remove the dialog
        if (document.getElementById("Dialog").style.display == "inline")
        {
          document.getElementById("Dialog").style.display="none";
          return;
        }
        DialogShow(Question,Type,DefaultAns,CallbackMethod);
      }
    }
  }
}

//Execute this method to show the dialog
export function DialogShow(Question,Type,DefaultAns,CallbackMethod)
{
  var EDS=document.getElementById("Dialog");
  if (EDS==undefined) return;
  EDS.style.display = "inline";
  document.getElementById("DIA_Question").text=Question;
  if (Type == "OK" || Type == "OKC")
  {
    //Setup for the OK button
    document.getElementById("DIA_btnYes").style.display="none";
    document.getElementById("DIA_btnNo").style.display="none";    
    document.getElementById("DIA_btnOK").style.display="inline";
    if (Type == "OKC")
    {
      document.getElementById("DIA_btnCancel").style.display="inline";
    }
    else
    {
      document.getElementById("DIA_btnCancel").style.display="none";
    }
    document.getElementById("DIA_btnOK").onclick  = () =>{ ButtonPressed("OK",CallbackMethod); };
    document.getElementById("DIA_btnCancel").onclick  = () =>{ ButtonPressed("C",CallbackMethod); };
    return;
  }
  //Setup Yes/No/Cancel options
  document.getElementById("DIA_btnYes").style.display="inline";
  document.getElementById("DIA_btnNo").style.display="inline";    
  document.getElementById("DIA_btnOK").style.display="none";
  if(Type == "YNC")
  {
    document.getElementById("DIA_btnHeight").y=112;
    document.getElementById("DIA_btnCancel").style.display="inline";
    document.getElementById("DIA_btnCancel").onclick  = () =>{ ButtonPressed("C",CallbackMethod); };
  }
  else{
    document.getElementById("DIA_btnHeight").y=150;
    document.getElementById("DIA_btnCancel").style.display="none";
  }
  document.getElementById("DIA_btnYes").value=0;
  if (DefaultAns=="Y")
  {
    document.getElementById("DIA_btnYes").value=1;
    document.getElementById("DIA_btnNo").value=0;
  }
  else if (DefaultAns=="N")
  {
    document.getElementById("DIA_btnYes").value=0;
    document.getElementById("DIA_btnNo").value=1;
  }
  document.getElementById("DIA_btnYes").onclick = () =>{ ButtonPressed("Y",CallbackMethod); };
  document.getElementById("DIA_btnNo").onclick  = () =>{ ButtonPressed("N",CallbackMethod); };
  return;
}

//Execute this method to show the dialog
export function DialogShow2 (Question, Actions)
{
  var EDS=document.getElementById("Dialog");
  if (EDS==undefined) return;
  
  EDS.style.display = "inline";

  if (Question.search("\n") != -1) {
    document.getElementById("DIA_Question").style.fontSize = 40
  } else {
    document.getElementById("DIA_Question").style.fontSize = 55
  }

  document.getElementById("DIA_Question").text=Question;

  for (var ai in Actions)
  {
    let action = Actions[ai]
    let btn = document.getElementById(`DIA_btnO${ai}`)

    if (!!action)
    {
      btn.style.display="inline";
      
      if (!!action.label)
        btn.text = action.label

      if (!!action.fun)
        btn.onclick = () => { ButtonPressed(ai, action.fun) }
    }
    else
    {
      btn.style.display="none";
    }
  }
}

function ButtonPressed(AnsButton,Method)
{
  var EDS=document.getElementById("Dialog");
  if (EDS==undefined) return;
  EDS.style.display = "none";
  if (Method != undefined && Method != "")
    {
      Method(AnsButton);
      return;
    }
  return;
}
