// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCDpfq91fHOY-xSJ_KcTCgh-AHmRrQDZKw",
  authDomain: "roadkill-group-demo.firebaseapp.com",
  databaseURL: "https://roadkill-group-demo-default-rtdb.firebaseio.com",
  projectId: "roadkill-group-demo",
  storageBucket: "roadkill-group-demo.firebasestorage.app",
  messagingSenderId: "5914900639",
  appId: "1:5914900639:web:be55b09067ee3f6f370aaa"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Prevent HTML injection
function escapeHTML(html) {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
}

// One comment box
const Comment = (props) => (
  <div className="commentBox">
    <p><strong>{props.username}</strong></p>
    <p>{props.comment}</p>
    <small>{props.time}</small>
  </div>
);

const MAX_COUNT = 3;

// Comment list
class CommentList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { comments: [] };
  }

  componentWillMount() {
    const commentsRef = db.ref("comments");
    commentsRef.once("value", (snapshot) => {
      if (snapshot.numChildren() > MAX_COUNT) {
        const keys = Object.keys(snapshot.val());
        const deleteCount = snapshot.numChildren() - MAX_COUNT;
        const updates = {};
        for (let i = 0; i < deleteCount; i++) {
          updates[keys[i]] = null;
        }
        commentsRef.update(updates);
      }
    });
  }

  componentDidMount() {
  const commentsRef = db.ref("comments");

  commentsRef.on("value", snapshot => {
    const comments = snapshot.val() || {};
    const keys = Object.keys(comments);

    // Build an array with IDs + data
    const commentList = keys.map(key => ({
      id: key,
      ...comments[key],
    }));

    // Sort oldest → newest by insertion order (Firebase keys are chronological)
    commentList.sort((a, b) => (a.id > b.id ? 1 : -1));

    // ✅ Trim if more than MAX_COUNT
    if (commentList.length > MAX_COUNT) {
      const excess = commentList.length - MAX_COUNT;
      const toRemove = commentList.slice(0, excess); // oldest ones
      toRemove.forEach(item => db.ref("comments/" + item.id).remove());
      // Keep only the newest MAX_COUNT for display
      this.setState({ comments: commentList.slice(-MAX_COUNT).reverse() });
    } else {
      // Otherwise, just display them (newest first)
      this.setState({ comments: commentList.reverse() });
    }
  });
}



  render() {
    return (
      <div>
        {this.state.comments.map((c, i) => (
          <Comment
            key={i}
            username={c.username}
            comment={c.comment}
            time={c.time}
          />
        ))}
      </div>
    );
  }
}

// Comment form
class CommentForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { username: "", comment: "" };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const username = escapeHTML(this.state.username.trim());
    const comment = escapeHTML(this.state.comment.trim());
    if (!username || !comment) return;

    db.ref("comments").push({
      username,
      comment,
      time: new Date().toLocaleString("en-US", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    });

    this.setState({ comment: "" });
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Your name"
          value={this.state.username}
          onChange={this.handleChange}
        />
        <textarea
          name="comment"
          placeholder="Report details"
          value={this.state.comment}
          onChange={this.handleChange}
        ></textarea>
        <button type="submit">Post Report</button>
      </form>
    );
  }
}

// Main App
const App = () => (
  <div>
    <h1>Colorado Track and Report Roadkill</h1>
    <CommentForm />
    <CommentList />
  </div>
);

ReactDOM.render(<App />, document.getElementById("app"));