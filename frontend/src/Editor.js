import React, { Component } from 'react';
import ReactQuill from 'react-quill';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'react-quill/dist/quill.snow.css';
import './Editor.css';
import Dropdown from 'react-dropdown';
import { toast } from 'react-toastify';

const Modal = ({
    handleClose,
    show,
    children
}) => {
    var showHideClassName = show ? "modal display-block" : "modal display-none";

    return (
        <div className={showHideClassName} >
            <section className="modal-main editorModal" >
                <button className="modalClose"
                    onClick={handleClose}>
                    <FontAwesomeIcon icon="times"/> </button>
                    {children}
            </section>
        </div>
        );
};

export default class Editor extends Component {
                    constructor(props) {
                    super(props)
        this.state = {
                id: '',
                text: this.props.editTarget.content || '',
                title: this.props.editTarget.title || '',
                privacy: this.props.editTarget ? (this.props.editTarget.public ? 'public' : 'private') : 'private',
                category: this.props.editTarget.category || 'journal',
                message: '',
                uploadingImage: false,
            }
            this.handleChange = this.handleChange.bind(this)
            this.handleInputChange = this.handleInputChange.bind(this)
            this.uploadFile = this.uploadFile.bind(this)
            this.imageHandler = this.imageHandler.bind(this)
        }

    componentWillReceiveProps(nextProps) {
        if (nextProps.modalVisible !== this.props.modalVisible) {
            this.setState({
                id: nextProps.editTarget._id || '',
                text: nextProps.editTarget.content || '',
                title: nextProps.editTarget.title || '',
                privacy: nextProps.editTarget ? (nextProps.editTarget.public ? 'public' : 'private') : 'private',
                category: nextProps.editTarget.category || 'journal',
                message: '',
            })
        }
    }

    handleChange(content, delta, source, editor) {
        this.setState({
            text: content,
        })
    }

    imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            this.setState({ uploadingImage: true })
            const file = input.files[0];
            if (file.size / 1024 / 1024 > 2) { // in MB
                toast("Due to server limitations we can't accept images over 2MB in size. Please resize your image and try again.", {
                    className: 'green-toast',
                });
            } else {
                const formData = new FormData();

                formData.append('image', file);

                // Save current cursor state
                const range = this.quillRef.getEditor().getSelection(true);

                //Insert temporary loading placeholder image
                this.quillRef.getEditor().insertEmbed(range.index, 'image', `${window.location.origin}/spinner.gif`);

                // Move cursor to right side of image (easier to continue typing)
                this.quillRef.getEditor().setSelection(range.index + 1);

                const res = await this.uploadFile(formData); // API post, returns image location as string e.g. 'http://www.example.com/images/foo.png'

                // Remove placeholder image
                this.quillRef.getEditor().deleteText(range.index, 1);

                // Insert uploaded image
                this.quillRef.getEditor().insertEmbed(range.index, 'image', '/uploads/' + res.filename);
            }
        }
    }

    modules = {
                    toolbar: {
                    container: [
                    ['bold', 'italic', 'underline', 'blockquote'],
                [{
                    'list': 'ordered'
                }, {
                    'list': 'bullet'
            }],
            ['link', 'image'],
            ['clean']
        ],
            handlers: {
                    'image': this.imageHandler
            }
        }
    }



    formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image'
    ]

    uploadFile = async (file) => {
        let result = await fetch('/api/image/upload', {
            method: 'POST',
            body: file
        })
        .then(res => (res.ok ? res : Promise.reject(res)))
        .then(res => res.json())
        this.setState({uploadingImage: false})
        return result;
    }

    handleInputChange = (event) => {
        const target = event.target;
                const value = target.type === 'checkbox' ? target.checked : target.value;
                const name = target.name;
        this.setState({[name]:value});
            }

    handleSubmit = (event) => {
                    event.preventDefault();
        if (this.state.text && this.state.uploadingImage === false) {
            if (this.props.mode === "create") {
                    fetch('/api/post/new', {
                        method: 'POST',
                        body: JSON.stringify(this.state),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(res => {
                            if (res.status === 200) {
                                return res.json();
                            } else {
                                this.setState({ message: 'Error saving post, try again.' })
                                return false;
                            }
                        })
                        .then(res => {
                            this.setState({
                                text: '',
                                title: '',
                                message: '',
                                privacy: 'private',
                                category: 'journal',
                                uploadingImage: false
                            });
                            this.props.hideModal();
                            this.props.updatePosts(res);
                        })
                } else if (this.props.mode === "edit") {
                    fetch('/api/post/edit', {
                        method: 'POST',
                        body: JSON.stringify(this.state),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(res => {
                            if (res.status === 200) {
                                return res.json();
                            } else {
                                this.setState({ message: 'Error editing post, try again.' })
                                return false;
                            }
                        })
                        .then(res => {
                            this.setState({
                                text: '',
                                title: '',
                                message: '',
                                privacy: 'private',
                                category: 'journal',
                                uploadingImage: false
                            });
                            this.props.hideModal();
                            this.props.updatePosts(res);
                        })
                }
                }
            }

    render() {
                    let postPrivacy, postCategory;
        // if (this.props.mode === "edit") {
        //     postPrivacy = this.props.editTarget.public === true ? "public" : "private";
        //     postCategory = this.props.editTarget.category;
        // } else {
        //     postPrivacy = this.state.privacy;
        //     postCategory = this.state.category;
        // }
        return (
            <Modal show={this.props.modalVisible} handleClose={this.props.hideModal}>
                    <form
                        onSubmit={this.handleSubmit}
                    >
                        <div onDrop={(e) => { e.preventDefault(); return false; }}>
                            {this.props.mode === 'create' ?
                                <strong>Create new post</strong>
                                :
                                <strong>Edit post</strong>
                            }
                            {this.state.message && <div className="formMessage">{this.state.message}</div>}
                            <input
                                hidden
                                disabled
                                type="text"
                                name="id"
                                value={this.state.id}
                            />
                            <input
                                type="text"
                                className="full-width"
                                name="title"
                                placeholder="Title (optional)"
                                value={this.state.title}
                                onChange={this.handleInputChange}
                            />
                            <ReactQuill
                                ref={(el) => this.quillRef = el}
                                value={this.state.text || ""}
                                onChange={this.handleChange}
                                theme="snow"
                                placeholder="Write something magical!"
                                modules={this.modules}
                                formats={this.formats} />
                        </div>
                        <div className="postOptions">
                            <div className="col">
                                <strong>Privacy</strong>
                                <label htmlFor="private">
                                    <input
                                        onChange={this.handleInputChange}
                                        type="radio"
                                        name="privacy"
                                        id="private"
                                        value="private"
                                        checked={this.state.privacy === "private"} />
                                    <span>Private (visible only to me)</span>
                                </label>
                                <label htmlFor="public">
                                    <input
                                        onChange={this.handleInputChange}
                                        type="radio"
                                        name="privacy"
                                        id="public"
                                        value="public"
                                        checked={this.state.privacy === "public"} />
                                    <span>Public (visible to everyone)</span>
                                </label>
                            </div>
                            <div className="col">
                                {this.props.mode === 'create' &&
                                    <>
                                        <strong>Category</strong>
                                        <label htmlFor="category_journal">
                                            <input
                                                onChange={this.handleInputChange}
                                                type="radio"
                                                name="category"
                                                id="category_journal"
                                                value="journal"
                                                checked={this.state.category === "journal"} />
                                            <span>Journal</span>
                                        </label>
                                        <label htmlFor="category_spellbook">
                                            <input
                                                onChange={this.handleInputChange}
                                                type="radio"
                                                name="category"
                                                id="category_spellbook"
                                                value="spellbook"
                                                checked={this.state.category === "spellbook"} />
                                            <span>Spells</span>
                                        </label>
                                        <label htmlFor="category_lore">
                                            <input
                                                onChange={this.handleInputChange}
                                                type="radio"
                                                name="category"
                                                id="category_lore"
                                                value="lore"
                                                checked={this.state.category === "lore"} />
                                            <span>Notes</span>
                                        </label>
                                    </>
                                }
                            </div>
                        </div>
                        <button
                            style={{ marginTop: "1rem" }}
                            type="submit"
                            className="full-width"
                            disabled={this.state.submitDisabled}>
                            {this.props.mode === 'create' ? "Create post" : "Edit post"}
                        </button>
                    </form>
                </Modal>
                )
            }
        }
