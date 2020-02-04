import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Modal({ handleClose, show, altarModal, children }) {
    var containerClassName = [
      "modal",
      (show ? "display-block" : "display-none")
    ].join(" ");

    var modalClassName = [
      "modal-main",
      (altarModal ? "altar-modal" : "")
    ].join(" ");

    return (
      <div className={containerClassName}>
        <section className={modalClassName}>
          <button className="modalClose" onClick={handleClose}><FontAwesomeIcon icon="times" /></button>
            {children}
        </section>
      </div>
    );
};
