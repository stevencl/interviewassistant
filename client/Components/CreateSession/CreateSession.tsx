import React from 'react';

type InterviewerStartFormProps = {
    initializeSocket: (interviewerName: string) => Promise<string>;
}

interface InterviewerStartFormState {
    name: string;
}

export default class CreateSession extends React.Component<InterviewerStartFormProps, InterviewerStartFormState> {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({[event.target.name]: event.target.value});
    }

    async handleSubmit(event) {
      event.preventDefault();
      const urlForInterviewee = await this.props.initializeSocket(this.state.name);
      this.props["history"].push({
        pathname: "/awaitInterviewee",
        state: {
            urlForInterviewee: urlForInterviewee,
            name: this.state.name
        }
      });
    }

    render() {
      return (
        <form className="flex-container" onSubmit={this.handleSubmit}>
            <div className="flex-item" >
            <label>
                Name:
                <input name="name" type="text" value={this.state.name} onChange={this.handleChange} />
            </label>
          </div>
          <input className="flex-item" type="submit" value="Create Interview Session" />
        </form>
      );
    }
}
