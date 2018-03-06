function Subtitles(props: { label: string }) {
    return <footer className="footer">
        <div className="container">
        <div className="content has-text-centered">
            <p>{props.label || '\u00A0'}</p>
        </div>
        </div>
    </footer>;
}
