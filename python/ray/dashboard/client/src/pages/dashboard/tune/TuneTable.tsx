import {
  Checkbox,
  createStyles,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Theme,
  WithStyles,
  withStyles,
} from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { TuneTrial } from "../../../api";
import DialogWithTitle from "../../../common/DialogWithTitle";
import NumberedLines from "../../../common/NumberedLines";
import { StoreState } from "../../../store";
import { dashboardActions } from "../state";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
      "& > :not(:first-child)": {
        marginTop: theme.spacing(2),
      },
    },
    table: {
      marginTop: theme.spacing(1),
      height: "700px",
      overflowY: "auto",
    },
    cell: {
      padding: theme.spacing(1),
      textAlign: "right",
      "&:last-child": {
        paddingRight: theme.spacing(1),
      },
    },
    checkboxRoot: {
      height: "500px",
      overflowY: "auto",
      overflowX: "auto",
    },
    paramChecklist: {
      marginBottom: theme.spacing(2),
    },
  });

const mapStateToProps = (state: StoreState) => ({
  tuneInfo: state.dashboard.tuneInfo,
});

type State = {
  metricParamColumn: string;
  ascending: boolean;
  sortedColumn: keyof TuneTrial | undefined;
  metricColumns: string[];
  paramColumns: string[];
  errorTrial: string;
  open: boolean;
};

const mapDispatchToProps = dashboardActions;

class TuneTable extends React.Component<
  WithStyles<typeof styles> &
    ReturnType<typeof mapStateToProps> &
    typeof mapDispatchToProps,
  State
> {
  timeout: number = 0;

  state: State = {
    sortedColumn: undefined,
    ascending: true,
    metricParamColumn: "",
    metricColumns: [],
    paramColumns: [],
    errorTrial: "",
    open: false,
  };

  onColumnClick = (column: keyof TuneTrial, metricParamColumn?: string) => {
    let ascending = this.state.ascending;
    if (column === this.state.sortedColumn) {
      ascending = !ascending;
    } else {
      ascending = true;
    }
    this.setState({
      sortedColumn: column,
      ascending: ascending,
    });

    if (metricParamColumn) {
      this.setState({
        metricParamColumn: metricParamColumn,
      });
    }
  };

  /**
   * Replaces all underscores with spaces and capitalizes all words
   * in str
   */
  humanize = (str: string) =>
    str
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  handleOpen = (key: string | number) => {
    if (typeof key === "number") {
      key = key.toString();
    }
    this.setState({
      open: true,
      errorTrial: key,
    });
  };

  handleClose = () => {
    this.setState({
      open: false,
    });
  };

  sortedCell = (
    name: keyof TuneTrial,
    chosenMetricParam?: string,
    index?: number,
  ) => {
    const { tuneInfo, classes } = this.props;
    const { sortedColumn, ascending, metricParamColumn } = this.state;
    let label: "desc" | "asc" = "asc";

    if (name === sortedColumn && !ascending) {
      label = "desc";
    }

    if (tuneInfo === null) {
      return;
    }

    let onClick = () => this.onColumnClick(name);
    if (chosenMetricParam) {
      onClick = () => this.onColumnClick(name, chosenMetricParam);
    }

    if (!index) {
      index = 0;
    }

    let active = false;
    let key: string = name + index.toString();
    if (chosenMetricParam) {
      key = chosenMetricParam + index.toString();
      active = chosenMetricParam === metricParamColumn && sortedColumn === name;
    } else {
      active = name === sortedColumn;
    }

    return (
      <TableCell className={classes.cell} key={key} onClick={onClick}>
        <TableSortLabel active={active} direction={label} />
        {chosenMetricParam
          ? this.humanize(chosenMetricParam)
          : this.humanize(name)}
      </TableCell>
    );
  };

  sortedTrialRecords = () => {
    const { tuneInfo } = this.props;
    const { sortedColumn, ascending, metricParamColumn } = this.state;

    if (tuneInfo === null || Object.keys(tuneInfo.trial_records).length === 0) {
      return null;
    }

    const trialDetails = Object.values(tuneInfo.trial_records);

    if (!sortedColumn) {
      return trialDetails;
    }

    let getAttribute = (trial: TuneTrial) => trial[sortedColumn!];
    if (sortedColumn === "metrics" || sortedColumn === "params") {
      getAttribute = (trial: TuneTrial) =>
        trial[sortedColumn!][metricParamColumn];
    }

    if (sortedColumn) {
      if (ascending) {
        trialDetails.sort((a, b) =>
          getAttribute(a) > getAttribute(b) ? 1 : -1,
        );
      } else if (!ascending) {
        trialDetails.sort((a, b) =>
          getAttribute(a) < getAttribute(b) ? 1 : -1,
        );
      }
    }

    return trialDetails;
  };

  handleMetricChoiceChange = (name: string) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let { metricColumns } = this.state;
    if (event.target.checked) {
      metricColumns.push(name);
      this.setState({
        metricColumns: metricColumns,
      });
    } else {
      metricColumns = metricColumns.filter((value) => value !== name);
      this.setState({
        metricColumns: metricColumns,
      });
    }
  };

  metricChoices = (metricNames: string[]) => {
    const { metricColumns } = this.state;

    return (
      <FormControl>
        <FormLabel component="legend">Select Metrics </FormLabel>
        <FormGroup>
          {metricNames.map((value) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={metricColumns.includes(value)}
                  onChange={this.handleMetricChoiceChange(value)}
                  value={value}
                  color="primary"
                />
              }
              label={value}
            />
          ))}
        </FormGroup>
      </FormControl>
    );
  };

  handleParamChoiceChange = (name: string) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let { paramColumns } = this.state;
    if (event.target.checked) {
      paramColumns.push(name);
      this.setState({
        paramColumns: paramColumns,
      });
    } else {
      paramColumns = paramColumns.filter((value) => value !== name);
      this.setState({
        paramColumns: paramColumns,
      });
    }
  };

  paramChoices = (paramNames: string[]) => {
    const { classes } = this.props;
    const { paramColumns } = this.state;
    return (
      <FormControl className={classes.paramChecklist}>
        <FormLabel component="legend">Select Parameters </FormLabel>
        <FormGroup>
          {paramNames.map((value) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={paramColumns.includes(value)}
                  onChange={this.handleParamChoiceChange(value)}
                  value={value}
                  color="primary"
                />
              }
              label={value}
            />
          ))}
        </FormGroup>
      </FormControl>
    );
  };

  render() {
    const { classes, tuneInfo } = this.props;

    const { metricColumns, paramColumns, open, errorTrial } = this.state;

    if (
      tuneInfo === null ||
      Object.keys(tuneInfo["trial_records"]).length === 0
    ) {
      return null;
    }

    const firstTrial = Object.keys(tuneInfo.trial_records)[0];
    const paramsDict = tuneInfo.trial_records[firstTrial].params;
    const paramNames = Object.keys(paramsDict).filter((k) => k !== "args");

    let viewableParams = paramNames;
    const paramOptions = paramNames.length > 3;
    if (paramOptions) {
      if (paramColumns.length === 0) {
        this.setState({
          paramColumns: paramNames.slice(0, 3),
        });
      }
      viewableParams = paramColumns;
    }

    const metricNames = Object.keys(tuneInfo.trial_records[firstTrial].metrics);

    let viewableMetrics = metricNames;
    const metricOptions = metricNames.length > 3;
    if (metricOptions) {
      if (metricColumns.length === 0) {
        this.setState({
          metricColumns: metricNames.slice(0, 3),
        });
      }
      viewableMetrics = metricColumns;
    }

    const trialDetails = this.sortedTrialRecords();

    return (
      <div className={classes.root}>
        <Grid container spacing={0}>
          {(paramOptions || metricOptions) && (
            <Grid item xs={2} className={classes.checkboxRoot}>
              {paramOptions && this.paramChoices(paramNames)}
              {metricOptions && this.metricChoices(metricNames)}
            </Grid>
          )}
          <Grid
            item
            xs={paramOptions || metricOptions ? 10 : 12}
            className={classes.table}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {this.sortedCell("trial_id")}
                  {this.sortedCell("job_id")}
                  {this.sortedCell("start_time")}
                  {viewableParams.map((value, index) =>
                    this.sortedCell("params", value, index),
                  )}
                  {this.sortedCell("status")}
                  {viewableMetrics.map((value, index) =>
                    this.sortedCell("metrics", value, index),
                  )}
                  <TableCell className={classes.cell} key="error">
                    Error
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trialDetails !== null &&
                  trialDetails.map((trial, index) => (
                    <TableRow key={index}>
                      <TableCell className={classes.cell}>
                        {trial["trial_id"]}
                      </TableCell>
                      <TableCell className={classes.cell}>
                        {trial["job_id"]}
                      </TableCell>
                      <TableCell className={classes.cell}>
                        {trial["start_time"]}
                      </TableCell>
                      {viewableParams.map((value, index) => (
                        <TableCell className={classes.cell} key={index}>
                          {trial["params"][value]}
                        </TableCell>
                      ))}
                      <TableCell className={classes.cell}>
                        {trial["status"]}
                      </TableCell>
                      {trial["metrics"] &&
                        viewableMetrics.map((value, index) => (
                          <TableCell className={classes.cell} key={index}>
                            {trial["metrics"][value]}
                          </TableCell>
                        ))}
                      <TableCell className={classes.cell}>
                        {trial["error"] === "No Error" ? (
                          "No Error"
                        ) : (
                          <Link
                            component="button"
                            variant="body2"
                            onClick={() => {
                              this.handleOpen(trial["trial_id"]);
                            }}
                          >
                            Show Error
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Grid>
        </Grid>
        {open && (
          <DialogWithTitle handleClose={this.handleClose} title="Error Log">
            {open && (
              <NumberedLines
                lines={tuneInfo.trial_records[errorTrial].error
                  .trim()
                  .split("\n")}
              />
            )}
          </DialogWithTitle>
        )}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withStyles(styles)(TuneTable));
