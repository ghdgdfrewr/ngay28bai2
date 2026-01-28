//HTTP request get,get/id,post,put/id, delete/id
async function LoadData() {
    try {
        let res = await fetch('http://localhost:3000/posts');
        let posts = await res.json()
        let body = document.getElementById("table-body");
        body.innerHTML = "";
        for (const post of posts) {
            // Apply strikethrough style for soft-deleted posts
            let rowStyle = post.isDeleted ? 'text-decoration: line-through; opacity: 0.6;' : '';
            let deleteButtonText = post.isDeleted ? 'Restore' : 'Delete';
            let deleteFunction = post.isDeleted ? `Restore(${post.id})` : `Delete(${post.id})`;
            
            body.innerHTML += `<tr style="${rowStyle}">
                <td>${post.id}</td>
                <td>${post.title}</td>
                <td>${post.views}</td>
                <td><input type='submit' value='${deleteButtonText}' onclick='${deleteFunction}'/><input type='submit' value='Edit' onclick='EditPost(${post.id})'/></td>
                <td><input type='submit' value='Comments' onclick='LoadComments(${post.id})'/></td>
            </tr>`
        }
        return false;
    } catch (error) {
        console.log(error);
    }

}//
async function Save() {
    let id = document.getElementById("id_txt").value;
    let title = document.getElementById("title_txt").value;
    let views = document.getElementById("view_txt").value;
    
    if (!title || !views) {
        alert("Please fill in all fields");
        return;
    }
    
    if (id) {
        // Edit existing post
        let getItem = await fetch("http://localhost:3000/posts/" + id);
        if (getItem.ok) {
            let res = await fetch('http://localhost:3000/posts/' + id,
                {
                    method: 'PUT',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(
                        {
                            title: title,
                            views: views
                        }
                    )
                })
            if (res.ok) {
                console.log("edit du lieu thanh cong");
                ClearForm();
            }
        } else {
            alert("Post not found");
        }
    } else {
        // Create new post with auto-increment ID
        let res = await fetch('http://localhost:3000/posts');
        let posts = await res.json();
        let maxId = 0;
        for (const post of posts) {
            let postId = parseInt(post.id);
            if (postId > maxId) {
                maxId = postId;
            }
        }
        let newId = String(maxId + 1);
        
        let res2 = await fetch('http://localhost:3000/posts',
            {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    {
                        id: newId,
                        title: title,
                        views: views,
                        isDeleted: false
                    }
                )
            })
        if (res2.ok) {
            console.log("them du lieu thanh cong");
            ClearForm();
        }
    }
    LoadData();
}

function ClearForm() {
    document.getElementById("id_txt").value = "";
    document.getElementById("title_txt").value = "";
    document.getElementById("view_txt").value = "";
}

function EditPost(id) {
    fetch('http://localhost:3000/posts/' + id)
        .then(res => res.json())
        .then(post => {
            document.getElementById("id_txt").value = post.id;
            document.getElementById("title_txt").value = post.title;
            document.getElementById("view_txt").value = post.views;
        });
}
async function Delete(id) {
    // Soft delete: mark as deleted instead of removing
    let res = await fetch('http://localhost:3000/posts/' + id, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            isDeleted: true
        })
    });
    if (res.ok) {
        console.log("xoa mem thanh cong");
    }
    LoadData();
}

async function Restore(id) {
    // Restore soft-deleted post
    let res = await fetch('http://localhost:3000/posts/' + id, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            isDeleted: false
        })
    });
    if (res.ok) {
        console.log("phuc hoi thanh cong");
    }
    LoadData();
}

// Comments CRUD operations
async function LoadComments(postId) {
    try {
        let res = await fetch('http://localhost:3000/comments?postId=' + postId);
        let comments = await res.json();
        let container = document.getElementById("comments-container");
        container.innerHTML = `<h3>Comments for Post ${postId}</h3>`;
        
        for (const comment of comments) {
            let commentStyle = comment.isDeleted ? 'text-decoration: line-through; opacity: 0.6;' : '';
            let deleteButtonText = comment.isDeleted ? 'Restore' : 'Delete';
            let deleteFunction = comment.isDeleted ? `RestoreComment(${comment.id})` : `DeleteComment(${comment.id})`;
            
            container.innerHTML += `
                <div style="background-color: white; padding: 10px; margin: 5px 0; border-radius: 3px; ${commentStyle}">
                    <p><strong>ID:</strong> ${comment.id}</p>
                    <p><strong>Text:</strong> ${comment.text}</p>
                    <button onclick='EditComment(${comment.id})'>Edit</button>
                    <button onclick='${deleteFunction}'>${deleteButtonText}</button>
                </div>
            `;
        }
        
        container.innerHTML += `
            <h4>Add New Comment</h4>
            <input type='text' id='comment_text' placeholder='Comment text'/>
            <input type='submit' value='Add Comment' onclick='AddComment(${postId})' />
        `;
    } catch (error) {
        console.log(error);
    }
}

async function AddComment(postId) {
    let text = document.getElementById('comment_text').value;
    if (!text) {
        alert("Please enter comment text");
        return;
    }
    
    let res = await fetch('http://localhost:3000/comments');
    let comments = await res.json();
    let maxId = 0;
    for (const comment of comments) {
        let commentId = parseInt(comment.id);
        if (commentId > maxId) {
            maxId = commentId;
        }
    }
    let newId = String(maxId + 1);
    
    let res2 = await fetch('http://localhost:3000/comments', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: newId,
            text: text,
            postId: String(postId),
            isDeleted: false
        })
    });
    
    if (res2.ok) {
        console.log("them comment thanh cong");
        document.getElementById('comment_text').value = "";
        LoadComments(postId);
    }
}

async function EditComment(commentId) {
    let newText = prompt("Enter new comment text:");
    if (!newText) return;
    
    let res = await fetch('http://localhost:3000/comments/' + commentId, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text: newText
        })
    });
    
    if (res.ok) {
        console.log("edit comment thanh cong");
        // Reload comments for the current post
        let commentRes = await fetch('http://localhost:3000/comments/' + commentId);
        let comment = await commentRes.json();
        LoadComments(comment.postId);
    }
}

async function DeleteComment(commentId) {
    // Soft delete comment
    let res = await fetch('http://localhost:3000/comments/' + commentId, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            isDeleted: true
        })
    });
    
    if (res.ok) {
        console.log("xoa comment thanh cong");
        // Get post ID to reload comments
        let commentRes = await fetch('http://localhost:3000/comments/' + commentId);
        let comment = await commentRes.json();
        LoadComments(comment.postId);
    }
}

async function RestoreComment(commentId) {
    // Restore soft-deleted comment
    let res = await fetch('http://localhost:3000/comments/' + commentId, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            isDeleted: false
        })
    });
    
    if (res.ok) {
        console.log("phuc hoi comment thanh cong");
        // Get post ID to reload comments
        let commentRes = await fetch('http://localhost:3000/comments/' + commentId);
        let comment = await commentRes.json();
        LoadComments(comment.postId);
    }
}

LoadData();
