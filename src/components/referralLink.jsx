import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';

function ReferralModal({link}) {

    const [Copy, setCopy] = useState(null);
    


    return createPortal(
            <div className="modal fade" id="RefferalModal" tabIndex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content" style={{ wordWrap: "break-word", maxWidth: "90%", maxHeight: "80vh", overflowY: "auto", padding: "20px", scrollbarWidth: "none", scrollbarColor: "#6c757d #f1f1f1" }}>
                        <div className="modal-header">
                            <h5 className="modal-title" id="errorModalLabel">Referral Link</h5>
                            <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close" ><span aria-hidden="true">&times;</span></button>
                        </div>
                        <div className="modal-body">
                            {/* Display the error message */}
                            <div className='d-flex align-items-center'>

                            <div className=" flex-grow-1">
                                        {/* <label>Copy your Link: </label> */}
                                        <input className="form-control" type="text" readOnly value={link} />
                                    </div>
                                    <div>
                                    <button className='btn btn-warning ms-2' onClick={()=> {navigator.clipboard.writeText(link);toast.success("Copied")}}>Copy</button>
                                    </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
     , document.body)
}

export default ReferralModal;
