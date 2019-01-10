import React, { Component } from 'react';
import axios from 'axios';

const githubGraphQL = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: `bearer ${
    process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN
    }`,
  }
})

const getIssuesOfRepository = (path, cursor) => {
  const [organization, repository] = path.split('/');

  return githubGraphQL.post('', {
    query: GET_ORGANIZATION,
    variables: { organization, repository, cursor },
  });
};

const resolveIssuesQuery = queryResult => () => ({
  organization: queryResult.data.data.organization,
  errors: queryResult.data.errors,
})

const GET_ORGANIZATION = `
  query(
    $organization: String!,
    $repository: String!,
    $cursor: String
  ) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository){
        name
        url
        issues(last: 5, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;

const TITLE = 'React GraphQL GitHub Client';

class App extends Component {
  state= {
    path: 'the-road-to-learn-react/the-road-to-learn-react',
    organization: null,
    errors: null,
  }
  onChange = event => {
    this.setState({path: event.target.value})
  }
  onSubmit = event => {
    this.onFetchFromGitHub(this.state.path);
    event.preventDefault();
  }

  componentDidMount() {
    // fetch data
    this.onFetchFromGitHub(this.state.path);
  }

  onFetchFromGitHub = (path, cursor) => {
    getIssuesOfRepository(path, cursor).then(queryResult =>
      this.setState(resolveIssuesQuery(queryResult, cursor)),
    );
  };

  onFetchMoreIssues = () => {
    debugger;
    const that = this;
    const {endCursor} = that.state.organization.repository.issues.pageInfo;
    this.onFetchFromGitHub(that.state.path, endCursor);
  }

  render() {
    return (
      <div>
        <h1>{TITLE}</h1>
        <form onSubmit={this.onSubmit}>
          <label htmlFor='url'>
          Show open issues for https://github.com/
          </label>
          <input
            id="url"
            type="text"
            value={this.state.path}
            onChange= {this.onChange}
            style= {{width: '300px'}}
            />
          <button type="submit">Search</button>
        </form>
        <hr />
        {
          this.state.organization ? (
            <Organization organization={this.state.organization} errors={this.state.errors} onFetchMoreIssues={this.onFetchMoreIssues}/>
          ) : (
            <p>No organization found!!!</p>
          )
        }
      </div>
    );
  }
}

const Organization = ({ organization, errors, onFetchMoreIssues}) => {
  if (errors) {
    return (
      <p>
        <strong>
         Something went wrong:
        </strong>
        {errors.map(error => error.message).join(' ')}
      </p>
    );
  }
  return (
    <div>
      <p>
        <strong>Issues from Organization: </strong>
        <a href={organization.url}>{organization.name}</a>
      </p>
      {
          organization.repository ? (
            <Repository repository={organization.repository} onFetchMoreIssues={onFetchMoreIssues}/>
          ) : (
            <p>No repository found!!!</p>
          )
        }
  </div>
  );
};

const Repository = ({ repository, errors , onFetchMoreIssues}) => {
  if (errors) {
    return (
      <p>
        <strong>
         Something went wrong:
        </strong>
        {errors.map(error => error.message).join(' ')}
      </p>
    );
  }
  return (
    <div>
      <p><strong>
        In Repository:
        </strong>
        <a href={repository.url}>{repository.name}</a>
      </p>
      <ul>
      {repository.issues.edges.map(issue => (
        <li key={issue.node.id}>
          <a href={issue.node.url}>{issue.node.title}</a>

           <ul>
            {issue.node.reactions.edges.map(reaction => (
              <li key={reaction.node.id}>{reaction.node.content}</li>
            ))}
          </ul>
        </li>
      ))}
      </ul>
      <hr />
      <button onClick={onFetchMoreIssues}>More</button>
    </div>
  )
}

export default App;